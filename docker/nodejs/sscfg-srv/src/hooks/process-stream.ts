import { NotAuthenticated } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { toVid as toVidEncryptKey } from './process-encrypt-keys';
import { toVid as toVidAttachFile } from './process-attach-files';
import { toVid as toVidUserParameter } from './process-user-parameters';

function isAdmin(stream: any, userId: number): boolean {
  return stream.members?.some((m: any) => m.admin && m.user_id === userId);
}

function appendAdmins(data: any[], userId: number): any[] {
  return data.map((s: any) => {
    const admin = isAdmin(s, userId);
    return admin != null ? { ...s, admin } : s;
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { params, method, result } = context;
  const { user } = params;
  if (user == null) {
    throw new NotAuthenticated();
  }
  if (method === 'get') {
    const admin = isAdmin(result, user.id);
    if (admin != null) {
      context.result = { ...context.result, admin };
    }
  } else if (method === 'find') {
    if (result.data != null) {
      context.result.data = appendAdmins(result.data, user.id);
    } else {
      context.result = appendAdmins(result, user.id);
    }
  }
  return context;
};

export const prepareCleanupSecrets = () => (async (context: HookContext): Promise<HookContext> => {
  const { app, params, id } = context;
  const ids1 = (await app.service('encrypt-keys').find({
    query: { stream_id: id },
    user: params.user,
  })).map((x: any) => toVidEncryptKey(x));
  const ids2 = (await app.service('attach-files').find({
    query: { stream_id: id, secret: true },
    user: params.user,
  })).map((x: any) => toVidAttachFile(x));
  const ids3 = (await app.service('user-parameters').find({
    query: { stream_id: id, secret: true },
    user: params.user,
  })).map((x: any) => toVidUserParameter(x));
  context.params = { ...params, secrets: ids1.concat(ids2, ids3) };
  return context;
});

export const cleanupSecrets = () => (async (context: HookContext): Promise<HookContext> => {
  const { app, params } = context;
  const { authentication } = params;
  const vault = app.service('vault');
  const { secrets } = params;
  if (secrets != null) {
    await Promise.all(secrets.map(async (v: string) => vault.remove(v, { authentication })));
  }
  return context;
});
