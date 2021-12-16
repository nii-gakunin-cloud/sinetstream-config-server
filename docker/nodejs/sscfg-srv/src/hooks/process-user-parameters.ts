import { BadRequest, NotFound } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { getItems, replaceItems } from 'feathers-hooks-common';
import { verifyTargetFormat } from './process-target';

export function toVid(data: Record<string, any>): string {
  const { id: pid, stream_id: sid, user_id: uid } = data;
  return `streams.${sid}.user-parameters.${uid}.${pid}`;
}

async function registerUserParameter(context: HookContext): Promise<HookContext> {
  const { params, result, app } = context;
  const { authentication } = params;
  if (params.userParameter != null) {
    const vault = app.service('vault');
    await vault.update(toVid(result), params.userParameter, { authentication });
  }
  return context;
}

async function unregisterUserParameter(context: HookContext): Promise<HookContext> {
  const { params, result, app } = context;
  const { authentication } = params;
  const vault = app.service('vault');
  try {
    await vault.remove(toVid(result), { authentication });
  } catch (e) {
    if (!(e instanceof NotFound)) {
      throw e;
    }
  }
  return context;
}

function processContent(context: HookContext, item: Record<string, any>): HookContext {
  const { content: b64content, ...other } = item;
  const content = Buffer.from(b64content, 'base64');
  if (!item.secret) {
    replaceItems(context, { ...other, content });
  } else {
    replaceItems(context, { ...other, content: null });
    const userParameter = { value: b64content, size: content.length };
    context.params = { ...context.params, userParameter };
  }
  return context;
}

async function getContentFromVault(
  context: HookContext,
  data: Record<string, any>,
): Promise<string> {
  const { params, app } = context;
  const { authentication } = params;
  const vid = toVid(data);
  const vault = app.service('vault');
  const { value } = await vault.get(vid, { authentication });
  return value;
}

async function getCurrentValue(context: HookContext): Promise<Record<string, any>> {
  const { params, service, id } = context;
  if (id == null) {
    throw new BadRequest();
  }
  const { user, transaction } = params;
  const { secret, content, ...other } = await service.get(id, { user, transaction });
  const b64content = secret
    ? await getContentFromVault(context, other)
    : content.toString('base64');
  return { secret, content: b64content, ...other };
}

async function beforePatchProcess(context: HookContext): Promise<HookContext> {
  const item = getItems(context);
  if (item.target != null) {
    verifyTargetFormat(item.target);
  }
  if (item.content == null && item.secret == null) {
    return context;
  }
  if (item.content == null) {
    const { content, secret } = await getCurrentValue(context);
    if (secret === item.secret) {
      return context;
    }
    return processContent(context, { ...item, content });
  }
  if (item.secret == null) {
    const { secret } = await getCurrentValue(context);
    return processContent(context, { ...item, secret });
  }
  return processContent(context, item);
}

async function verifyUser(context: HookContext, item: Record<string, any>): Promise<void> {
  const members = context.app.service('members');
  const { user, transaction } = context.params;
  const query = {
    stream_id: item.stream_id,
    user_id: item.user_id,
    $limit: 0,
  };
  const res = await members.find({ query, user, transaction });
  if (res.total === 0) {
    throw new BadRequest('A user who is not a member has been specified.');
  }
}

async function beforeCreateProcess(context: HookContext): Promise<HookContext> {
  const item = getItems(context);
  verifyTargetFormat(item.target);
  await verifyUser(context, item);
  return processContent(context, item);
}

export const postProcessingContent = (): Hook => (context: HookContext): HookContext => {
  const {
    isBinary, content, secret, ...other
  } = getItems(context);
  if (!isBinary && !secret) {
    const textContent = content.toString();
    replaceItems(context, {
      isBinary, textContent, secret, ...other,
    });
  } else {
    replaceItems(context, { isBinary, secret, ...other });
  }
  return context;
};

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
  } else if (type === 'after') {
    if (method === 'create') {
      return registerUserParameter(context);
    }
    if (method === 'patch') {
      const { result } = context;
      if (result.secret) {
        return registerUserParameter(context);
      }
      return unregisterUserParameter(context);
    }
    if (method === 'remove') {
      return unregisterUserParameter(context);
    }
  }
  return context;
};
