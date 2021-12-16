import { BadRequest, MethodNotAllowed, NotFound } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { randomBytes } from 'crypto';
import { getItems, replaceItems } from 'feathers-hooks-common';
import { verifyTargetFormat } from './process-target';

export function toVid(data: Record<string, any>): string {
  const { id: kid, stream_id: sid } = data;
  return `streams.${sid}.encrypt-keys.${kid}`;
}

function getEncryptKey(size: number, base64Key?: string): string {
  if (size < 128 || size % 64 !== 0 || size > 256) {
    throw new BadRequest('The value specified for the size of the encryption key is not valid.');
  }
  if (base64Key != null) {
    const key = Buffer.from(base64Key, 'base64');
    if (key.length * 8 !== Number(size)) {
      throw new BadRequest('The encryption key does not match the size.');
    }
    return base64Key;
  }
  const buf = randomBytes(size / 8);
  return buf.toString('base64');
}

async function generateVersion(context: HookContext): Promise<number> {
  const {
    data, params, service, app,
  } = context;
  const { stream_id: sid, target } = data;
  const { user, transaction } = params;
  const res = await service.find({
    query: {
      stream_id: sid,
      target,
      $limit: 1,
      $sort: {
        version: -1,
      },
    },
    paginate: app.get('paginate'),
    user,
    transaction,
  });
  if (res.total === 0) {
    return 1;
  }
  const tgt = res.data[0];
  return tgt.version + 1;
}

async function prepareEncryptKey(context: HookContext): Promise<HookContext> {
  const item = getItems(context);
  const {
    size, target, key, ...otherData
  } = item;
  verifyTargetFormat(target);
  const keyValue = getEncryptKey(size, key);
  const version = await generateVersion(context);

  replaceItems(context, {
    ...otherData, size, target, version,
  });
  const encryptKey = {
    value: keyValue,
    version,
    size,
    target,
  };
  context.params = { ...context.params, encryptKey };
  return context;
}

async function disableOldKey(context: HookContext): Promise<void> {
  const { params, service, result } = context;
  const { id, target, stream_id: sid } = result;
  const query = {
    target,
    stream_id: sid,
    id: { $ne: id },
  };
  const { user, transaction } = params;
  try {
    await service.patch(
      null,
      { enabled: false },
      { query, user, transaction },
    );
  } catch (e) {
    if (!(e instanceof NotFound)) {
      throw e;
    }
  }
}

async function registerEncryptKey(context: HookContext): Promise<HookContext> {
  await disableOldKey(context);
  const { params, app, result } = context;
  const { authentication } = params;
  const vault = app.service('vault');
  await vault.update(toVid(result), params.encryptKey, { authentication });
  return context;
}

async function unmodifiedProperties(context: HookContext): Promise<HookContext> {
  const {
    data, params, id, service,
  } = context;
  const { user, transaction } = params;
  if (id != null) {
    const cur = await service.get(id, { user, transaction });
    const {
      stream_id: sid, target, version, size,
    } = cur;
    context.data = {
      ...data, stream_id: sid, target, version, size,
    };
  }
  return context;
}

async function disallowModifyOldRecord(context: HookContext): Promise<void> {
  const {
    params, id, service, app,
  } = context;
  if (id != null) {
    const { user, transaction } = params;
    const cur = await service.get(id, { user, transaction });
    const { target, stream_id: sid, version } = cur;
    const res = await service.find({
      query: {
        $limit: 0,
        target,
        stream_id: sid,
        version: { $gt: version },
      },
      paginate: app.get('paginate'),
      user,
      transaction,
    });
    if (res.total > 0) {
      throw new MethodNotAllowed();
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { method, type } = context;
  if (method === 'create') {
    if (type === 'before') {
      return prepareEncryptKey(context);
    } if (type === 'after') {
      return registerEncryptKey(context);
    }
  } else if (type === 'before') {
    if (['update', 'patch'].includes(method)) {
      await disallowModifyOldRecord(context);
      if (method === 'update') {
        return unmodifiedProperties(context);
      }
    }
  }
  return context;
};
