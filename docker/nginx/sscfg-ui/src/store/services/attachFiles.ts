import { HookContext } from '@feathersjs/feathers';
import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class AttachFile extends BaseModel {
  static modelName = 'AttachFile'

  static instanceDefaults() {
    return {
      target: '',
      comment: '',
      secret: false,
      enabled: true,
      content: null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static diffOnPatch(data: { [key: string]: any}): {[key:string]: any} {
    const {
      comment, enabled, secret, target, content,
    } = data;
    if (content == null) {
      return {
        comment, enabled, secret, target,
      };
    }
    return {
      comment, enabled, secret, target, content,
    };
  }
}

const servicePath = 'attach-files';

const servicePlugin = makeServicePlugin({
  Model: AttachFile,
  service: feathersClient.service(servicePath),
  servicePath,
});

const eagerUser = async (context: HookContext) => {
  const { params } = context;
  const query = { $joinEager: 'user' };
  params.query = { ...query, ...params.query };
  return context;
};

const processAttachFile = async (context: HookContext) => {
  const { data } = context;
  const { content, ...otherData } = data;
  if (content != null && content instanceof File) {
    const buf = await content.arrayBuffer();
    const contentB64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    // eslint-disable-next-line no-param-reassign
    context.data = { ...otherData, content: contentB64 };
  }
  return context;
};

feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [eagerUser],
    get: [eagerUser],
    create: [processAttachFile, eagerUser],
    update: [],
    patch: [processAttachFile, eagerUser],
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
