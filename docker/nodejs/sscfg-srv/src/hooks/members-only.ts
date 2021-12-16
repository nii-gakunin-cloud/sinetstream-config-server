import { BadRequest, NotAuthenticated } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { checkContext, getItems } from 'feathers-hooks-common';

type Query = Record<string, any>;

function streamsQuery(context: HookContext): Query {
  const { app, params } = context;
  const { user } = params;
  if (user == null) {
    throw new NotAuthenticated();
  }
  const knex = app.get('knex');
  return {
    'streams.id': { $in: knex.select('stream_id').from('members').where('user_id', user.id) },
  };
}

function adminMembersQuery(context: HookContext): Query {
  const { app, params } = context;
  const knex = app.get('knex');
  const { user } = params;
  if (user == null) {
    throw new NotAuthenticated();
  }
  return {
    stream_id: {
      $in: knex.select('stream_id').from('members').where('user_id', user.id).where('admin', true),
    },
  };
}

const adminMembersOnly = (): Hook => async (context: HookContext): Promise<HookContext> => {
  const { params, method } = context;
  if (!(method === 'get' || method === 'find')) {
    return context;
  }
  const query = adminMembersQuery(context);
  const { query: origQuery } = params;
  if (origQuery != null) {
    const { stream_id: sidQuery, ...otherQuery } = origQuery;
    if (sidQuery != null) {
      params.query = {
        ...otherQuery,
        $and: [{ stream_id: sidQuery }, query],
      };
    } else {
      params.query = { ...params.query, ...query };
    }
  } else {
    params.query = { ...query };
  }
  return context;
};

function mergeQuery(q1?: Query, q2?: Query): Query {
  return { ...q1, ...q2 };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { params, method, path } = context;
  if (!(method === 'get' || method === 'find')) {
    return context;
  }
  if (path === 'streams') {
    params.query = mergeQuery(params.query, streamsQuery(context));
  }
  return context;
};

type User = Record<string, any>;

function getUser(context: HookContext): User {
  const { params } = context;
  if (params.user == null) {
    throw new NotAuthenticated();
  }
  return params.user;
}

function mergeUserQuery(context: HookContext): void {
  const user = getUser(context);
  const query = { user_id: user.id };
  const { query: origQuery } = context.params;
  if (origQuery == null) {
    context.params.query = { ...query };
    return;
  }
  const { user_id: uidQuery, ...otherQuery } = origQuery;
  if (uidQuery == null) {
    context.params.query = { ...origQuery, ...query };
    return;
  }
  context.params.query = {
    ...otherQuery,
    $and: [{ user_id: uidQuery }, query],
  };
}

const onlyMyself = (): Hook => async (context: HookContext): Promise<HookContext> => {
  checkContext(context, 'before', ['get', 'find', 'remove']);
  mergeUserQuery(context);
  return context;
};

const exceptMyself = (): Hook => async (context: HookContext): Promise<HookContext> => {
  checkContext(context, 'after', ['patch', 'remove']);
  const user = getUser(context);
  const item = getItems(context);
  if (item.user_id === user.id) {
    throw new BadRequest('Cannot delete a record about myself.');
  }
  return context;
};

export {
  adminMembersOnly,
  onlyMyself,
  User,
  getUser,
  exceptMyself,
};
