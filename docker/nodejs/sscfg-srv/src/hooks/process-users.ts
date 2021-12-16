import { BadRequest, GeneralError } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { getItems, replaceItems, SyncContextFunction } from 'feathers-hooks-common';

function beforeCreateProcess(context: HookContext): HookContext {
  const { password, ...item } = getItems(context);
  replaceItems(context, item);
  context.params.processUser = { password };
  return context;
}

function beforePatchProcess(context: HookContext): HookContext {
  const { currentPassword, password, ...item } = getItems(context);
  replaceItems(context, item);
  context.params.processUser = { currentPassword, password };
  return context;
}

async function createPolicy(context: HookContext, id: number): Promise<string> {
  const { rootPath } = context.app.get('hashicorpVault');
  const policy = `
path "${rootPath}users/${id}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
`;
  const vault = context.app.service('sys-vault');
  const name = `user-${id}`;
  await vault.update(`sys/policy/${name}`, { policy });
  return name;
}

async function removePolicy(context: HookContext, name: string): Promise<void> {
  const vault = context.app.service('sys-vault');
  await vault.remove(`sys/policy/${name}`);
}

async function createVaultUser(
  context: HookContext, id: number, name: string, password: string,
): Promise<void> {
  const vault = context.app.service('sys-vault');
  const policy = await createPolicy(context, id);
  const data = {
    path: `auth/userpass/users/${name}`,
    password,
    token_policies: [policy, 'default'],
  };
  try {
    await vault.create(data);
  } catch (e) {
    await removePolicy(context, policy);
    throw e;
  }
}

async function removeVaultUser(context: HookContext, name: string): Promise<void> {
  const vault = context.app.service('sys-vault');
  await vault.remove(`auth/userpass/users/${name}`);
}

async function afterCreateProcess(context: HookContext): Promise<void> {
  const { password } = context?.params?.processUser ?? {};
  const { id, name } = getItems(context);
  if (id == null || name == null) {
    throw new GeneralError();
  }
  if (password == null || password.length === 0) {
    throw new BadRequest('You must specify a password.');
  }
  await createVaultUser(context, id, name, password);
}

async function checkCurrentPassword(context: HookContext, password: string): Promise<void> {
  const { name } = getItems(context);
  const data = {
    path: `auth/userpass/login/${name}`,
    password,
  };
  const vault = context.app.service('sys-vault');
  try {
    await vault.create(data);
  } catch (e) {
    throw new BadRequest('The password is incorrect.');
  }
}

async function changePassword(
  context: HookContext, currentPassword: string, password: string,
): Promise<void> {
  const { name } = getItems(context);
  const { user } = context.params;
  const admin = user?.systemAdmin;
  if (admin == null || !admin) {
    if (password != null && currentPassword == null) {
      throw new BadRequest('You must specify the password before the change.');
    }
    await checkCurrentPassword(context, currentPassword);
  }
  const data = {
    path: `auth/userpass/users/${name}/password`,
    password,
  };
  const vault = context.app.service('sys-vault');
  await vault.create(data);
}

async function afterPatchProcess(context: HookContext): Promise<void> {
  const { currentPassword, password } = context?.params?.processUser ?? {};
  if (password != null) {
    await changePassword(context, currentPassword, password);
  }
}

async function afterRemoveProcess(context: HookContext): Promise<void> {
  const { id, name } = getItems(context);
  if (id == null || name == null) {
    throw new GeneralError();
  }
  await removeVaultUser(context, name);
  await removePolicy(context, `user-${id}`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { type, method } = context;
  if (type === 'before') {
    if (method === 'create') {
      return beforeCreateProcess(context);
    }
    if (method === 'patch') {
      return beforePatchProcess(context);
    }
  }
  if (type === 'after') {
    if (method === 'create') {
      await afterCreateProcess(context);
    } else if (method === 'patch') {
      await afterPatchProcess(context);
    } else if (method === 'remove') {
      await afterRemoveProcess(context);
    }
  }
  return context;
};

const isChangePassword = (): SyncContextFunction<boolean> => (context: HookContext): boolean => {
  const { type } = context;
  if (type === 'before') {
    const { password } = context.data;
    return password != null;
  }
  const { password } = context?.params?.processUser ?? {};
  return password != null;
};

export {
  isChangePassword,
};
