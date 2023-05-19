import { Hook, HookContext } from '@feathersjs/feathers';
import { getItems, replaceItems } from 'feathers-hooks-common';

function appendExpirationCondition(orig: string | undefined): string {
  if (orig == null) {
    return 'expiration';
  }
  if (orig === 'expiration') {
    return orig;
  }
  if (orig.startsWith('[')) {
    const tbls = orig.slice(1, -1).split(',');
    if (!tbls.includes('expiration')) {
      tbls.push('expiration');
    }
    return `[${tbls.join(',')}]`;
  }
  return `[${orig},expiration]`;
}

function withinExpirationTime(context: HookContext): void {
  const { query: origQuery } = context.params;
  const {
    expirationTime: exp, $joinEager: join, $all, ...otherQuery
  } = origQuery ?? {};
  const $joinEager = appendExpirationCondition(join);
  if ($all) {
    context.params.query = { ...otherQuery, $joinEager };
  } else {
    const expirationTime = (exp == null
      ? { 'expiration.expirationTime': { $gt: new Date().toISOString() } }
      : {
        $and: [
          { 'expiration.expirationTime': exp },
          { 'expiration.expirationTime': { $gt: new Date().toISOString() } },
        ],
      });
    context.params.query = {
      ...otherQuery,
      ...expirationTime,
      $joinEager,
    };
  }
}

async function processAccessKey(
  context: HookContext,
  item: Record<string, any>,
): Promise<Record<string, any>> {
  const { authentication, vaultToken } = context.params ?? {};
  const vault = context.app.service('vault');
  const { user_id: userId, id } = item;
  const vid = `users/${userId}/api-access-keys/${id}`;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, ...info } = await vault.get(vid, { authentication, vaultToken });
  return { ...item, ...info };
}

async function populateVaultInfo(context: HookContext): Promise<void> {
  const items = getItems(context);
  if (items instanceof Array) {
    replaceItems(
      context,
      await Promise.all(items.map(async (item) => processAccessKey(context, item))),
    );
  } else {
    replaceItems(context, await processAccessKey(context, items));
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { type, method } = context;
  if (!['find', 'get'].includes(method)) {
    return context;
  }
  if (type === 'before') {
    withinExpirationTime(context);
  } else if (type === 'after') {
    await populateVaultInfo(context);
  }
  return context;
};
