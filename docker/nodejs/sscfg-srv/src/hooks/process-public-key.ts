import {
  BadRequest, FeathersError, NotAuthenticated, NotFound,
} from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { getItems } from 'feathers-hooks-common';
import sshpk from 'sshpk';

interface KeyParams {
  publicKey: string;
  original?: string;
  fingerprint: string;
}

export function toVid(data: Record<string, any>): string {
  const { id: kid, user_id: uid } = data;
  return `users.${uid}.user-public-keys.${kid}`;
}

function normalize(publicKey: string): KeyParams {
  const key = sshpk.parseKey(publicKey, 'auto');
  if (key.type !== 'rsa') {
    throw new BadRequest('Must be RSA public key.');
  }
  const fingerprint = key.fingerprint('sha256').toString();
  const opensshKey = key.toString('pkcs1');
  if (opensshKey === publicKey) {
    return { fingerprint, publicKey: opensshKey };
  }
  return { fingerprint, publicKey: opensshKey, original: publicKey };
}

function processPublicKey(context: HookContext): HookContext {
  const { params, data } = context;
  const { publicKey, ...otherData } = data;
  if (publicKey == null) {
    throw new BadRequest('publicKey: is a required property');
  }
  try {
    const keyParams = normalize(publicKey);
    context.data = { ...otherData, fingerprint: keyParams.fingerprint };
    context.params = { ...params, publicKey: keyParams };
    return context;
  } catch (e: any) {
    if (e instanceof FeathersError) {
      throw e;
    }
    throw new BadRequest(e.message);
  }
}

async function registerPublicKey(context: HookContext): Promise<HookContext> {
  const { params, result, app } = context;
  const { authentication } = params;
  const vid = toVid(result);
  const vault = app.service('vault');
  await vault.update(vid, params.publicKey, { authentication });
  return context;
}

async function unregisterVaultValue(context: HookContext, vid: string): Promise<void> {
  const { params, app } = context;
  const { authentication } = params;
  const vault = app.service('vault');
  await vault.remove(vid, { authentication });
}

async function unregisterPublicKey(context: HookContext): Promise<HookContext> {
  const items = getItems(context);
  if (items instanceof Array) {
    await Promise.all(items
      .map((x) => (toVid(x)))
      .map(async (vid) => (unregisterVaultValue(context, vid))));
  } else {
    const vid = toVid(items);
    await unregisterVaultValue(context, vid);
  }
  return context;
}

async function updateOtherRecord(context: HookContext): Promise<void> {
  const { service, params, id } = context;
  const { user, transaction } = params;
  if (!user) {
    throw new NotAuthenticated();
  }
  const basicQuery = {
    user_id: user.id,
    defaultKey: true,
  };
  const query = id != null ? { ...basicQuery, id: { $ne: id } } : basicQuery;
  try {
    await service.patch(
      null,
      { defaultKey: false },
      { query, user, transaction },
    );
  } catch (e) {
    if (!(e instanceof NotFound)) {
      throw e;
    }
  }
}

async function countDefaultRecords(context: HookContext): Promise<number> {
  const {
    service, params, result, method,
  } = context;
  const { user, transaction } = params;
  if (!user) {
    throw new NotAuthenticated();
  }
  const basicQuery = {
    user_id: user.id,
    defaultKey: true,
    $limit: 0,
  };
  const { id, defaultKey } = result;
  const query = id != null ? { ...basicQuery, id: { $ne: id } } : basicQuery;
  const res = await service.find({ query, user, transaction });
  return method !== 'remove' && defaultKey ? res.total + 1 : res.total;
}

async function ensureDefaultRecord(context: HookContext): Promise<void> {
  const { service, params, result } = context;
  const defaultRecords = await countDefaultRecords(context);
  if (defaultRecords < 1) {
    const { user, transaction } = params;
    if (!user) {
      throw new NotAuthenticated();
    }
    const basicQuery = {
      user_id: user.id,
      $limit: 1,
      $sort: {
        updatedAt: -1,
      },
    };
    const { id } = result;
    const query = id != null ? { ...basicQuery, id: { $ne: id } } : basicQuery;
    const res = await service.find({ query, user, transaction });
    if (res.total > 0) {
      const { id: targetId } = res.data[0];
      await service.patch(targetId, { defaultKey: true }, { user, transaction });
    }
  }
}

function updateUserId(context: HookContext) {
  const { data, params } = context;
  const { user } = params;
  if (!user) {
    throw new NotAuthenticated();
  }
  const { user_id: uid, user: kUser, ...otherData } = data;
  if (uid != null && uid !== user.id) {
    throw new BadRequest('User ID cannot be specified.');
  }
  if (kUser?.id != null && kUser.id !== user.id) {
    throw new BadRequest('User ID cannot be specified.');
  }
  context.data = { ...otherData, user_id: user.id };
}

async function countPublicKey(context: HookContext): Promise<number> {
  const { service, params } = context;
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    query: _query, paginate: _paginate,
    user,
    ...otherParams
  } = params;
  if (!user) {
    throw new NotAuthenticated();
  }
  const query = {
    user_id: user.id,
    $limit: 0,
  };
  const paginate = { default: 1, max: 1 };
  const res = await service.find({
    ...otherParams,
    paginate,
    query,
    user,
  });
  return res.total;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const {
    type, method, data, params, id,
  } = context;
  const { user } = params;
  if (!user) {
    throw new NotAuthenticated();
  }
  if (type === 'before' && ['create', 'patch'].includes(method)) {
    if (data?.defaultKey != null && data.defaultKey) {
      await updateOtherRecord(context);
    } else {
      const keyCount = await countPublicKey(context);
      if ((method === 'create' && keyCount === 0)
       || (method === 'patch' && data?.defaultKey != null && keyCount === 1)) {
        throw new BadRequest('The default public key must be registered.');
      }
    }
    if (method === 'create') {
      updateUserId(context);
      return processPublicKey(context);
    }
    if (method === 'patch' && id == null) {
      throw new BadRequest();
    }
  }
  if (type === 'after') {
    if (['patch', 'remove'].includes(method)) {
      const item = getItems(context);
      if (item instanceof Array) {
        if (item.some((u) => user.id !== u.user_id)) {
          throw new BadRequest('It is forbidden to delete another user\'s public key.');
        }
      } else if (user.id !== item.user_id) {
        throw new BadRequest('It is forbidden to delete another user\'s public key.');
      }
    }
    await ensureDefaultRecord(context);
    if (method === 'create') {
      return registerPublicKey(context);
    } if (method === 'remove') {
      return unregisterPublicKey(context);
    }
  }
  return context;
};
