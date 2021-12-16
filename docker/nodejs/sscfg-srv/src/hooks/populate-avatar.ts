import { Hook, HookContext } from '@feathersjs/feathers';
import { createHash } from 'crypto';
import { checkContext, getItems, replaceItems } from 'feathers-hooks-common';

function generateAvatar(item: Record<string, any>): string {
  const { name, email } = item;
  const md5 = createHash('md5');
  md5.update(email != null ? email : name);
  const hash = md5.digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  checkContext(context, 'before', ['create', 'patch']);
  const { method } = context;
  const item = getItems(context);
  if (method === 'create' || (method === 'patch' && item?.email != null)) {
    const avatar = generateAvatar(item);
    replaceItems(context, { ...item, avatar });
  }
  return context;
};
