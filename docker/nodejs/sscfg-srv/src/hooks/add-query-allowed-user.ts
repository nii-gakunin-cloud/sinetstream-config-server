import { Hook, HookContext } from '@feathersjs/feathers';
import { getUser } from './members-only';

export function isSystemAdmin(context: HookContext): boolean {
  const user = getUser(context);
  return user.systemAdmin;
}

export function isMyself(context: HookContext): boolean {
  const { id } = context;
  const user = getUser(context);
  return user.id === Number(id);
}

export function checkSearchCriteria(context: HookContext): boolean {
  try {
    if (isSystemAdmin(context)) {
      return true;
    }
  // eslint-disable-next-line no-empty
  } catch (e) {}
  const { name } = context?.params?.query ?? {};
  if (typeof name === 'string') {
    return true;
  }
  return name?.$in != null;
}

function mergeUserQuery(context: HookContext): void {
  const user = getUser(context);
  if (isSystemAdmin(context)) {
    return;
  }
  const query = { id: user.id };
  const { query: origQuery } = context.params;
  if (origQuery == null) {
    context.params.query = { ...query };
    return;
  }
  const { id: uidQuery, ...otherQuery } = origQuery;
  if (uidQuery == null) {
    context.params.query = { ...origQuery, ...query };
    return;
  }
  context.params.query = {
    ...otherQuery,
    $and: [{ id: uidQuery }, query],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  mergeUserQuery(context);
  return context;
};
