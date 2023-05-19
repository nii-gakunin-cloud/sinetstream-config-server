import { BadRequest } from '@feathersjs/errors';
import { Hook, HookContext, Id } from '@feathersjs/feathers';
import { getItems, replaceItems } from 'feathers-hooks-common';
import { getUser } from './members-only';

async function checkStreams(context: HookContext): Promise<void> {
  const item = getItems(context);
  if (item.allPermitted) {
    if (item.streams != null && item.streams.length > 0) {
      throw new BadRequest('Only either the allPermitted flag or the streams should be specified.');
    }
  } else {
    if (item.streams == null || !(item.streams instanceof Array) || item.streams.length === 0) {
      throw new BadRequest('The streams must be specified.');
    }
    const membersService = context.app.service('members');
    const user = getUser(context);
    const ret = await Promise.all(item.streams.map(async (stream: any) => {
      const { id } = stream;
      const members = await membersService.find({
        query: {
          stream_id: id,
          user_id: user.id,
          $limit: 0,
        },
      });
      return members.total > 0;
    }));
    if (!ret.every((x) => x)) {
      throw new BadRequest('Something you do not have permission to view is specified.');
    }
  }
}

export function getAppRoleName(id: Id): string {
  return `access-key-${id}`;
}

async function registerVaultPolicy(context: HookContext): Promise<string> {
  const { app, data, result } = context;
  const { rootPath } = app.get('hashicorpVault');
  const user = getUser(context);
  const { allPermitted, streams } = data;
  let policy = `
path "${rootPath}users/${user.id}/*" {
  capabilities = ["read"]
}

path "${rootPath}users/${user.id}/user-public-keys/*" {
  capabilities = ["create", "read", "delete"]
}
`;
  if (allPermitted) {
    policy += `
path "${rootPath}streams/+/encrypt-keys/+" {
  capabilities = ["read"]
}

path "${rootPath}streams/+/attach-files/+" {
  capabilities = ["read"]
}

path "${rootPath}streams/+/user-parameters/${user.id}/+" {
  capabilities = ["read"]
}
`;
  } else {
    streams.forEach((s: any) => {
      policy += `
path "${rootPath}streams/${s.id}/encrypt-keys/+" {
  capabilities = ["read"]
}

path "${rootPath}streams/${s.id}/attach-files/+" {
  capabilities = ["read"]
}

path "${rootPath}streams/${s.id}/user-parameters/${user.id}/+" {
  capabilities = ["read"]
}
`;
    });
  }
  const vault = app.service('sys-vault');
  const policyName = getAppRoleName(result.id);
  const vid = `sys/policy/${policyName}`;
  await vault.update(vid, { policy });
  return policyName;
}

async function registerVaultAppRole(context: HookContext, name: string): Promise<void> {
  const { app } = context;
  const appRoleParams = {
    secret_id_num_uses: 0,
    secret_id_ttl: '4380h', // 6 month
    token_policies: ['default', name],
  };
  const vid = `auth/approle/role/${name}`;
  const vault = app.service('sys-vault');
  await vault.update(vid, appRoleParams);
}

async function getAppRoleId(context: HookContext, name: string): Promise<string> {
  const { app } = context;
  const vid = `auth/approle/role/${name}/role-id`;
  const vault = app.service('sys-vault');
  const { role_id: roleId } = await vault.get(vid);
  return roleId;
}

async function generateAppRoleSecretId(context: HookContext, name: string): Promise<string> {
  const { app } = context;
  const path = `auth/approle/role/${name}/secret-id`;
  const vault = app.service('sys-vault');
  const { secret_id: secretId } = await vault.create({ path });
  return secretId;
}

async function getSecretIdExpirationTime(
  context: HookContext,
  name: string,
  secretId: string,
): Promise<string> {
  const { app } = context;
  const path = `auth/approle/role/${name}/secret-id/lookup`;
  const vault = app.service('sys-vault');
  const { expiration_time: expirationTime } = await vault.create({ path, secret_id: secretId });
  return expirationTime;
}

async function storeAppRoleInfo(context: HookContext, info: Record<string, any>): Promise<void> {
  const { app, params } = context;
  const { authentication, vaultToken } = params;
  const vault = app.service('vault');
  const user = getUser(context);
  const { id, ...other } = info;
  const vid = `users/${user.id}/api-access-keys/${id}`;
  await vault.update(vid, other, { authentication, vaultToken });
}

async function addExpirationRecord(context: HookContext, expirationTime: string): Promise<void> {
  const { app, result, params } = context;
  const { transaction } = params;
  const service = app.service('access-key-expirations');
  await service.create(
    {
      expirationTime,
      api_access_key_id: result.id,
    },
    { transaction },
  );
}

async function registerAppRole(context: HookContext): Promise<void> {
  const name = await registerVaultPolicy(context);
  await registerVaultAppRole(context, name);
  const roleId = await getAppRoleId(context, name);
  const secretId = await generateAppRoleSecretId(context, name);

  const item = getItems(context);
  const expirationTime = await getSecretIdExpirationTime(context, name, secretId);
  await addExpirationRecord(context, expirationTime);
  const info = {
    id: item.id, roleId, secretId, expirationTime,
  };
  await storeAppRoleInfo(context, info);
  replaceItems(context, {
    ...item, expirationTime, roleId, secretId,
  });
}

async function removeAppRoleInfo(context: HookContext, id: any): Promise<void> {
  const { app, params } = context;
  const { authentication, vaultToken } = params;
  const vault = app.service('vault');
  const { user_id: userId } = getItems(context);
  const vid = `users/${userId}/api-access-keys/${id}`;
  await vault.remove(vid, { authentication, vaultToken });
}

async function unregisterVaultAppRole(context: HookContext, name: string): Promise<void> {
  const { app } = context;
  const vid = `auth/approle/role/${name}`;
  const vault = app.service('sys-vault');
  await vault.remove(vid);
}

async function unregisterVaultPolicy(context: HookContext, name: string): Promise<void> {
  const { app } = context;
  const vid = `sys/policy/${name}`;
  const vault = app.service('sys-vault');
  await vault.remove(vid);
}

async function unregisterAppRole(context: HookContext): Promise<void> {
  const { id } = context;
  if (id == null) {
    throw new BadRequest();
  }
  await removeAppRoleInfo(context, id);
  const name = getAppRoleName(id);
  await unregisterVaultAppRole(context, name);
  await unregisterVaultPolicy(context, name);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { type, method } = context;
  if (type === 'before') {
    if (method === 'create') {
      await checkStreams(context);
    }
  } else if (type === 'after') {
    if (method === 'create') {
      await registerAppRole(context);
    } else if (method === 'remove') {
      await unregisterAppRole(context);
    }
  }
  return context;
};
