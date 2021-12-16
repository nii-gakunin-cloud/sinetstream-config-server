import { HookContext } from '@feathersjs/feathers';
import { getItems, replaceItems } from 'feathers-hooks-common';
import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class UserParameter extends BaseModel {
  static modelName = 'UserParameter'

  static instanceDefaults() {
    return {
      target: '',
      comment: '',
      secret: true,
      enabled: true,
      content: null,
      textContent: null,
      isBinary: false,
      user_id: null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static diffOnPatch(data: { [key: string]: any}): {[key:string]: any} {
    const {
      comment, enabled, secret, target, content, textContent,
    } = data;
    const others = {
      comment, enabled, secret, target,
    };
    if (content != null) {
      return { content, ...others };
    }
    if (textContent != null) {
      return { textContent, ...others };
    }
    return others;
  }
}

const servicePath = 'user-parameters';

const servicePlugin = makeServicePlugin({
  Model: UserParameter,
  service: feathersClient.service(servicePath),
  servicePath,
});

const eagerUser = async (context: HookContext) => {
  const { params } = context;
  const query = { $joinEager: 'user' };
  params.query = { ...query, ...params.query };
  return context;
};

const processContent = async (context: HookContext) => {
  const item = getItems(context);
  const {
    isBinary, content, textContent, ...other
  } = item;
  if (content == null && textContent == null) {
    return context;
  }
  if (isBinary) {
    const buf = await content.arrayBuffer();
    const contentB64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    replaceItems(context, { content: contentB64, ...other });
  } else {
    replaceItems(context, { textContent, ...other });
  }
  return context;
};

feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [eagerUser],
    get: [eagerUser],
    create: [processContent, eagerUser],
    update: [],
    patch: [processContent, eagerUser],
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
