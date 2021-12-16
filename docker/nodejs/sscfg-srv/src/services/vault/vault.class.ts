/* eslint-disable no-underscore-dangle */
/* eslint max-classes-per-file: ["error", 2] */
import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { BadRequest, convert, MethodNotAllowed } from '@feathersjs/errors';
import { Id, Params, ServiceMethods } from '@feathersjs/feathers';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import path from 'path';
import { Application } from '../../declarations';

type Data = Record<string, string>;

class InnerVault extends AdapterService<Data> implements ServiceMethods<Data> {
  app: Application;

  request: AxiosInstance;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    super(options);
    this.app = app;
    const { addr, rootPath } = app.get('hashicorpVault');
    const url = new URL(rootPath.startsWith('v1/') ? rootPath : `v1/${rootPath}`, addr);
    this.request = axios.create({ baseURL: url.toString() });
  }

  get redis() {
    return this.app.get('redis');
  }

  static toTarget(id: Id): string {
    if (typeof id !== 'string') {
      throw new BadRequest();
    }
    return path.join(...id.split('.'));
  }

  async paramsToRequestConfig(params?: Params): Promise<AxiosRequestConfig> {
    let token: string;
    const { vaultToken } = params ?? {};
    if (vaultToken == null) {
      const { accessToken } = params?.authentication ?? {};
      if (accessToken == null) {
        return {};
      }
      token = await this.redis.get(accessToken);
    } else {
      token = vaultToken;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _find(params?: Params): Promise<Data[]> {
    throw new MethodNotAllowed();
  }

  async _get(id: Id, params?: Params): Promise<Data> {
    const target = InnerVault.toTarget(id);
    try {
      const cfg = await this.paramsToRequestConfig(params);
      const resp = await this.request.get(target, cfg);
      return resp.data.data;
    } catch (e: any) {
      if (e?.response?.status != null) {
        throw convert({ name: e.response.status });
      }
      throw e;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _create(data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  async _update(id: Id, data: Data, params?: Params): Promise<Data> {
    const target = InnerVault.toTarget(id);
    try {
      const cfg = await this.paramsToRequestConfig(params);
      await this.request.put(target, data, cfg);
      const resp = await this.request.get(target, cfg);
      return resp.data.data;
    } catch (e: any) {
      if (e?.response?.status != null) {
        throw convert({ name: e.response.status });
      }
      throw e;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _patch(id: Id, data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  async _remove(id: Id, params?: Params): Promise<Data> {
    const target = InnerVault.toTarget(id);
    try {
      const cfg = await this.paramsToRequestConfig(params);
      await this.request.delete(target, cfg);
      return { id: id.toString() };
    } catch (e: any) {
      if (e?.response?.status != null) {
        throw convert({ name: e.response.status });
      }
      throw e;
    }
  }
}

const docs: ServiceSwaggerOptions = {
  idType: 'string',
  securities: ['all'],
};

export class Vault {
  adapter: InnerVault;

  docs: ServiceSwaggerOptions = docs;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    this.adapter = new InnerVault(options, app);
  }

  async get(id: Id, params?: Params): Promise<Data> {
    return this.adapter.get(id, params);
  }

  async update(id: Id, data: Data, params?: Params): Promise<Data> {
    return this.adapter.update(id, data, params);
  }

  async remove(id: Id, params?: Params): Promise<Data | Data[]> {
    return this.adapter.remove(id, params);
  }

  get id(): string {
    return this.adapter.id;
  }

  get events(): string[] {
    return this.adapter.events;
  }
}
