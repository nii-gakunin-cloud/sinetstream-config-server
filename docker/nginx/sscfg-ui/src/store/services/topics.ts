import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class Topic extends BaseModel {
  static modelName = 'Topic'

  static instanceDefaults() {
    return {
    };
  }
}

const servicePath = 'topics';

const servicePlugin = makeServicePlugin({
  Model: Topic,
  service: feathersClient.service(servicePath),
  servicePath,
});

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
