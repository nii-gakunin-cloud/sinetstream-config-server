/* eslint-disable no-underscore-dangle */
/* eslint max-classes-per-file: ["error", 2] */
import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import {
  GeneralError, MethodNotAllowed, NotFound, Unavailable,
} from '@feathersjs/errors';
import {
  Id, Params, ServiceAddons, ServiceMethods,
} from '@feathersjs/feathers';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';
import { SysVault } from '../sys-vault/sys-vault.class';

type Data = Record<string, any>;

const OK = 'ok';

const NG = 'failed';

class InnerInfo extends AdapterService<Data> implements ServiceMethods<Data> {
  app: Application;

  vault: SysVault & ServiceAddons<any>;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    super(options);
    this.app = app;
    this.vault = app.service('sys-vault');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _find(params?: Params): Promise<Data[]> {
    throw new MethodNotAllowed();
  }

  get redis() {
    return this.app.get('redis');
  }

  get db() {
    return this.app.get('knex');
  }

  async getRedisStatus(): Promise<Record<string, string>> {
    await this.redis.ping();
    return { status: OK };
  }

  async getVaultStatus(): Promise<Record<string, string>> {
    const res = await this.vault.get('sys/seal-status', { query: { $select: 'all' } });
    if (typeof res === 'string') {
      throw new GeneralError();
    }
    return { status: res?.sealed === false ? OK : 'sealed' };
  }

  async getPgStatus(): Promise<Record<string, string>> {
    await this.db.raw('SELECT 1');
    return { status: OK };
  }

  async health(): Promise<Data> {
    const pg = this.getPgStatus();
    const vault = this.getVaultStatus();
    const redis = this.getRedisStatus();
    const res = await Promise.all([pg, vault, redis].map(async (x) => {
      try {
        return await x;
      } catch (e: any) {
        return { status: NG, error: e.toString() };
      }
    }));
    const status = res.every((x) => (x?.status === OK)) ? OK : NG;
    const ret = {
      status,
      detail: {
        pg: res[0],
        vault: res[1],
        redis: res[2],
      },
      uptime: process.uptime(),
    };
    if (status !== OK) {
      throw new Unavailable(undefined, ret);
    }
    return ret;
  }

  async version(): Promise<Data> {
    const { npm_package_version: version } = process.env;
    const gitOpts = this.app.get('git');
    return { version, ...gitOpts };
  }

  async conf(): Promise<Data> {
    const { authStrategies, shibboleth: shibParams } = this.app.get('authentication');
    const shibboleth = {
      enabled: authStrategies.includes('shibboleth'),
      url: shibParams.url,
    };
    return { shibboleth };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _get(id: Id, params?: Params): Promise<Data> {
    switch (id) {
      case 'health':
        return this.health();
      case 'version':
        return this.version();
      case 'config':
        return this.conf();
      default:
        throw new NotFound();
    }
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
  description: 'サーバ情報のサービス',
  idType: 'string',
};

export class Info {
  adapter: InnerInfo;

  docs: ServiceSwaggerOptions = docs;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    this.adapter = new InnerInfo(options, app);
  }

  async get(id: Id, params?: Params): Promise<Data> {
    return this.adapter.get(id, params);
  }
}
