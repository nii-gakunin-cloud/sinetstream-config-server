import { HookContext } from '@feathersjs/feathers';
import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class Member extends BaseModel {
  static modelName = 'Member'

  static instanceDefaults() {
    return {
      admin: false,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static diffOnPatch(data: { [key: string]: any}): {[key:string]: any} {
    const { admin } = data;
    return { admin };
  }
}

const servicePath = 'members';

const servicePlugin = makeServicePlugin({
  Model: Member,
  service: feathersClient.service(servicePath),
  servicePath,
});

const eagerUser = async (context: HookContext) => {
  const { params } = context;
  const query = { $joinEager: 'user' };
  params.query = { ...query, ...params.query };
  return context;
};

const completeUser = async (context: HookContext) => {
  const { result, app, params } = context;
  const service = app.service('users');
  const { user_id: uid } = result;
  if (uid != null && result.user == null) {
    const user = await service.get(uid, params);
    // eslint-disable-next-line no-param-reassign
    context.result = { ...result, user };
  }
  return context;
};

feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [eagerUser],
    get: [eagerUser],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [completeUser],
    update: [],
    patch: [],
    remove: [],
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
});

export default servicePlugin;
