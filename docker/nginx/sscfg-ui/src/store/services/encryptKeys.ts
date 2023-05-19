import { HookContext } from '@feathersjs/feathers';
import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class EncryptKey extends BaseModel {
  static modelName = 'EncryptKey';

  static instanceDefaults() {
    return {
      enabled: true,
      size: 256,
      target: '*.crypto.key',
      comment: '',
      generate: true,
      keyFile: null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static diffOnPatch(data: { [key: string]: any}): {[key:string]: any} {
    const { comment, enabled } = data;
    return { comment, enabled };
  }
}

const servicePath = 'encrypt-keys';

const servicePlugin = makeServicePlugin({
  Model: EncryptKey,
  service: feathersClient.service(servicePath),
  servicePath,
});

const eagerUser = async (context: HookContext) => {
  const { params } = context;
  const query = { $joinEager: '[user, latestVersion]' };
  params.query = { ...query, ...params.query };
  return context;
};

const completeUser = async (context: HookContext) => {
  const { result, params } = context;
  const { user } = params;
  if (user != null) {
    const { name, displayName, avatar } = user;
    result.user = { name, displayName, avatar };
  }
  return context;
};

const processKeyFile = async (context: HookContext) => {
  const { data } = context;
  const { keyFile, generate, ...otherData } = data;
  if (generate != null && generate) {
    // eslint-disable-next-line no-param-reassign
    context.data = { ...otherData };
  } else if (keyFile != null && keyFile instanceof File) {
    const buf = await keyFile.arrayBuffer();
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    // eslint-disable-next-line no-param-reassign
    context.data = { ...otherData, key: keyBase64 };
  }
  return context;
};

feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [eagerUser],
    get: [eagerUser],
    create: [processKeyFile],
    update: [],
    patch: [],
    remove: [],
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [completeUser, async (context: HookContext) => {
      // eslint-disable-next-line no-param-reassign
      context.result = { ...context.result, latest: true };
    }],
    update: [],
    patch: [async (context: HookContext) => {
      const {
        result, service, id, params,
      } = context;
      if (id != null) {
        const res = await service.get(id, { ...params, query: { $joinEager: 'latestVersion' } });
        const { latest } = res;
        // eslint-disable-next-line no-param-reassign
        context.result = { ...result, latest };
      }
      return context;
    }],
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
