import { BadRequest, NotFound } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { getItems, replaceItems } from 'feathers-hooks-common';
import { verifyTargetFormat } from './process-target';

export function toVid(data: Record<string, any>): string {
  const { id: aid, stream_id: sid } = data;
  return `streams.${sid}.attach-files.${aid}`;
}

async function registerAttachFile(context: HookContext): Promise<HookContext> {
  const { params, result, app } = context;
  const { attachFile, authentication } = params;
  if (attachFile != null) {
    const vid = toVid(result);
    const vault = app.service('vault');
    await vault.update(vid, attachFile, { authentication });
  }
  return context;
}

async function unregisterAttachFile(context: HookContext): Promise<HookContext> {
  const { params, result, app } = context;
  const { authentication } = params;
  const vid = toVid(result);
  const vault = app.service('vault');
  try {
    await vault.remove(vid, { authentication });
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
    const attachFile = { value: b64content, size: content.length };
    context.params = { ...context.params, attachFile };
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

async function beforeCreateProcess(context: HookContext): Promise<HookContext> {
  const item = getItems(context);
  verifyTargetFormat(item.target);
  return processContent(context, item);
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
      return registerAttachFile(context);
    }
    if (method === 'patch') {
      const { result } = context;
      if (result.secret) {
        return registerAttachFile(context);
      }
      return unregisterAttachFile(context);
    }
    if (method === 'remove') {
      return unregisterAttachFile(context);
    }
  }
  return context;
};
