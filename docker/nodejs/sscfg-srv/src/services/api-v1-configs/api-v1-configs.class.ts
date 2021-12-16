/* eslint-disable no-underscore-dangle */
/* eslint max-classes-per-file: ["error", 2] */
import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import {
  BadRequest, Forbidden, GeneralError, MethodNotAllowed, NotAuthenticated, NotFound,
} from '@feathersjs/errors';
import {
  Id, Params, ServiceAddons, ServiceMethods,
} from '@feathersjs/feathers';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';
import { AccessKeys as AccessKey } from '../../models/access-keys.model';
import { AccessKeys } from '../access-keys/access-keys.class';
import { ConfigFiles } from '../config-files/config-files.class';
import { Streams } from '../streams/streams.class';

type Data = Record<string, any>;

class InnerApiV1Configs extends AdapterService<Data> implements ServiceMethods<Data> {
  app: Application;

  streamService: Streams & ServiceAddons<any>;

  configFilesService: ConfigFiles & ServiceAddons<any>;

  akeyService: AccessKeys & ServiceAddons<any>;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    super(options);
    this.app = app;
    this.streamService = app.service('streams');
    this.configFilesService = app.service('config-files');
    this.akeyService = app.service('access-keys');
  }

  async getAccessKey(params?: Params): Promise<AccessKey> {
    const { user, authentication } = params ?? {};
    const { payload } = authentication ?? {};
    if (payload == null || payload.akeyId == null) {
      throw new BadRequest();
    }
    return this.akeyService.get(payload.akeyId, {
      query: { $joinEager: 'streams' },
      user,
      authentication,
    });
  }

  async _find(params?: Params): Promise<Data[]> {
    const { user } = params ?? {};
    if (user == null) {
      throw new NotAuthenticated();
    }
    const akey = await this.getAccessKey(params);
    let streams: Data[];
    if (!akey.allPermitted) {
      streams = akey.streams;
    } else {
      const ret = await this.streamService.find({
        ...params, paginate: false,
      });
      if (!(ret instanceof Array)) {
        throw new GeneralError();
      }
      streams = ret;
    }
    return streams
      .filter((stream) => stream.configFile != null && stream.configFile.trim().length > 0)
      .map(({ id, name }) => ({ id, name }));
  }

  async _get(id: Id, params?: Params): Promise<Data> {
    const sid = await this.getStreamId(id, params);
    const vaultParams = this.getVaultToken(params);
    return this.configFilesService.get(sid, {
      ...params,
      ...vaultParams,
      query: {
        $embed: 'text',
        $select: ['object', 'attachments', 'secrets'],
      },
    });
  }

  async getStreamId(id: Id, params?: Params): Promise<number> {
    const { user } = params ?? {};
    if (user == null) {
      throw new NotAuthenticated();
    }
    const ret = await this.streamService.find({
      ...params,
      query: { name: id },
      paginate: false,
    });
    if (!(ret instanceof Array)) {
      throw new GeneralError();
    }
    if (ret.length > 1) {
      throw new BadRequest();
    }
    if (ret.length === 0) {
      throw new NotFound();
    }
    const akey = await this.getAccessKey(params);
    const sid = ret[0].id;
    if (!akey.allPermitted && akey.streams.find((x: any) => x.id === sid) == null) {
      throw new Forbidden();
    }
    return sid;
  }

  get redis() {
    return this.app.get('redis');
  }

  async getVaultToken(params?: Params): Promise<Params> {
    const { authentication } = params ?? {};
    const token = authentication?.accessToken;
    if (token == null) {
      return {};
    }
    const vaultToken = await this.redis.get(token);
    return { vaultToken };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _create(data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _update(id: Id, data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _patch(id: Id, data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _remove(id: Id, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }
}

const docs: ServiceSwaggerOptions = {
  idType: 'string',
  securities: ['all'],
  operations: {
    find: {
      description: 'コンフィグ情報IDの一覧取得',
      parameters: [],
    },
    get: {
      description: '指定された id のコンフィグ情報を取得する',
    },
  },
  definitions: {
    configs_v1_list: {
      type: 'array',
      items: {
        type: 'string',
        description: 'コンフィグ情報のid',
      },
    },
    configs_v1: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'コンフィグ情報名',
        },
        config: {
          type: 'object',
          description: 'コンフィグ情報',
        },
        attachments: {
          type: 'array',
          description: '添付ファイル情報',
          items: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
                description: '添付ファイル(BASE64エンコード)',
              },
              target: {
                type: 'string',
                description: '設定ファイルへの埋め込み位置',
              },
            },
          },
        },
        secrets: {
          type: 'array',
          description: '秘匿情報一覧',
          items: {
            type: 'object',
            properties: {
              target: {
                type: 'string',
                description: '設定ファイルへの埋め込み位置',
              },
              id: {
                type: 'string',
                description: '秘匿情報ID',
              },
              ids: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: '秘匿情報ID',
                  },
                  version: {
                    type: 'number',
                    description: 'データ暗号鍵のバージョン',
                  },
                },
                description: '秘匿情報IDs',
              },
            },
          },
        },
      },
    },
  },
};

export class ApiV1Configs {
  adapter: InnerApiV1Configs;

  docs: ServiceSwaggerOptions = docs;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    this.adapter = new InnerApiV1Configs(options, app);
  }

  async find(params?: Params): Promise<string[]> {
    const ret = await this.adapter.find(params);
    if (!(ret instanceof Array)) {
      throw new GeneralError();
    }
    return ret.map(({ name }) => name);
  }

  async get(id: Id, params?: Params): Promise<Data> {
    return this.adapter.get(id, params);
  }

  get id(): string {
    return this.adapter.id;
  }

  get events(): string[] {
    return this.adapter.events;
  }
}
