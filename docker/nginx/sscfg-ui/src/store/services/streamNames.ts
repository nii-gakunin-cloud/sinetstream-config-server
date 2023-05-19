import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class StreamName extends BaseModel {
  static modelName = 'StreamName';
}

const servicePath = 'stream-names';

const servicePlugin = makeServicePlugin({
  Model: StreamName,
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
