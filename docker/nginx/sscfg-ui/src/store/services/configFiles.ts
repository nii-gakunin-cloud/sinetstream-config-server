import { disallow } from 'feathers-hooks-common';
import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class ConfigFile extends BaseModel {
  static modelName = 'ConfigFile'

  static instanceDefaults() {
    return {
      config: {},
      yaml: '',
    };
  }
}

const servicePath = 'config-files';

const servicePlugin = makeServicePlugin({
  Model: ConfigFile,
  service: feathersClient.service(servicePath),
  servicePath,
});

feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [disallow()],
    get: [],
    create: [disallow()],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()],
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
