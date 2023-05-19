import { HookContext } from '@feathersjs/feathers';
import { getItems, replaceItems } from 'feathers-hooks-common';
import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class User extends BaseModel {
  static modelName = 'User';

  static instanceDefaults() {
    return {
      password: null,
      currentPassword: null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static diffOnPatch(data: { [key: string]: any}): {[key:string]: any} {
    const {
      email, displayName, password, currentPassword,
    } = data;
    if (password == null) {
      return { email, displayName };
    }
    return { password, currentPassword };
  }
}

const servicePath = 'users';

const servicePlugin = makeServicePlugin({
  Model: User,
  service: feathersClient.service(servicePath),
  servicePath,
});

const clearPasswordFields = async (context: HookContext) => {
  const item = getItems(context);
  replaceItems(context, { ...item, ...User.instanceDefaults() });
};

feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [clearPasswordFields],
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
