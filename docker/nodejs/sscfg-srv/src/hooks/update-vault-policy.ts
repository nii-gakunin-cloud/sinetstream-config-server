import { GeneralError } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { checkContext, getItems } from 'feathers-hooks-common';

async function getPolicy(uid: number, context: HookContext): Promise<string> {
  const { service, app, params } = context;
  const { rootPath } = app.get('hashicorpVault');
  const initPolicy = `
path "${rootPath}users/${uid}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
  `;
  const { user, transaction } = params;
  const members = await service.find({
    query: { user_id: uid },
    user,
    transaction,
    paginate: false,
  });
  if (!Array.isArray(members)) {
    throw new GeneralError();
  }
  return initPolicy + members.map((member) => {
    const { stream_id: sid, admin } = member;
    if (admin) {
      return `
path "${rootPath}streams/${sid}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
`;
    }
    return `
path "${rootPath}streams/${sid}/attach-files/*" {
  capabilities = ["read"]
}

path "${rootPath}streams/${sid}/encrypt-keys/*" {
  capabilities = ["read"]
}

path "${rootPath}streams/${sid}/user-parameters/${uid}/*" {
  capabilities = ["read"]
}
`;
  }).join('');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  checkContext(context, 'after', ['create', 'patch', 'remove']);
  const vault = context.app.service('sys-vault');
  const { user_id: uid } = getItems(context);
  const policy = await getPolicy(uid, context);
  await vault.update(`sys/policy/user-${uid}`, { policy });
  return context;
};
