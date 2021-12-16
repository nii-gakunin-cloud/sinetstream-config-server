import { BadRequest, NotAuthenticated } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { checkContext, getItems, replaceItems } from 'feathers-hooks-common';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  checkContext(context, 'before', ['create', 'patch', 'update']);
  const { user } = context.params;
  if (!user) {
    throw new NotAuthenticated();
  }
  const { id: uid } = user;
  const item = getItems(context);
  if (item.user_id != null && item.user_id !== uid) {
    throw new BadRequest();
  }
  replaceItems(context, { ...item, user_id: uid });
  return context;
};
