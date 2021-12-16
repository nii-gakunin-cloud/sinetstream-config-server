import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class PublicKey extends BaseModel {
  static modelName = 'PublicKey'

  static instanceDefaults() {
    return {
      defaultKey: true,
      publicKey: '',
      comment: '',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static diffOnPatch(data: { [key: string]: any}): {[key:string]: any} {
    const { comment, defaultKey } = data;
    return { comment, defaultKey };
  }
}

const servicePath = 'public-keys';

const servicePlugin = makeServicePlugin({
  Model: PublicKey,
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
