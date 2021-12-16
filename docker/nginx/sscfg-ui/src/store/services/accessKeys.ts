import { HookContext } from '@feathersjs/feathers';
import { getItems, replaceItems } from 'feathers-hooks-common';
import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class AccessKey extends BaseModel {
  static modelName = 'AccessKey'

  static instanceDefaults() {
    return {
      allPermitted: true,
      streams: [],
      comment: '',
    };
  }
}

const servicePath = 'access-keys';

const servicePlugin = makeServicePlugin({
  Model: AccessKey,
  service: feathersClient.service(servicePath),
  servicePath,
});

feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [(context: HookContext) => {
      const { params } = context;
      params.query = { ...params.query, $joinEager: 'streams' };
      return context;
    }],
    get: [],
    create: [(context: HookContext) => {
      const { allPermitted, streams, ...other } = getItems(context);
      if (allPermitted) {
        replaceItems(context, { allPermitted, ...other });
      } else {
        replaceItems(context, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          streams: streams.map((s: any) => ({ id: s.id })),
          allPermitted,
          ...other,
        });
      }
    }],
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
