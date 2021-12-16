/* eslint-disable no-underscore-dangle */
/* eslint max-classes-per-file: ["error", 2] */
import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import {
  BadRequest, convert, GeneralError, MethodNotAllowed,
} from '@feathersjs/errors';
import {
  Id, Paginated, Params, ServiceMethods,
} from '@feathersjs/feathers';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

type Data = Record<string, any> | string;

const toHttpError = (e: any) => (
  e?.response?.status != null ? convert({ name: e.response.status }) : e
);
class InnerSysVault extends AdapterService<Data> implements ServiceMethods<Data> {
  app: Application;

  request: AxiosInstance;

  headers: Record<string, any>;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    super(options);
    this.app = app;
    const { addr, token } = app.get('hashicorpVault');
    const url = new URL('v1/', addr);
    this.headers = { Authorization: `Bearer ${token}` };
    this.request = axios.create({
      baseURL: url.toString(),
      headers: this.headers,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _find(params?: Params): Promise<Data[]> {
    try {
      const { path: target } = params ?? {};
      const resp = await this.request.get(target, { params: { list: true } });
      return resp?.data?.data?.keys as string[];
    } catch (e: any) {
      throw toHttpError(e);
    }
  }

  static selectResponse(resp: AxiosResponse, params?: Params): Data {
    if (params == null || params.query == null) {
      return resp.data.data;
    }
    const { $select: select } = params.query;
    if (select == null) {
      return resp.data.data;
    }
    if (select === 'all') {
      return resp.data;
    }
    return resp.data[select];
  }

  async _get(id: Id, params?: Params): Promise<Data> {
    try {
      const resp = await this.request.get(id as string);
      return InnerSysVault.selectResponse(resp, params);
    } catch (e: any) {
      throw toHttpError(e);
    }
  }

  async _create(data: Data, params?: Params): Promise<Data> {
    if (typeof data === 'string') {
      throw new BadRequest();
    }
    try {
      const { path: target, ...otherData } = data;
      const { headers } = params ?? {};
      const config = headers != null ? { headers } : {};
      const resp = await this.request.post(target, otherData, config);
      return InnerSysVault.selectResponse(resp, params);
    } catch (e: any) {
      throw toHttpError(e);
    }
  }

  async _update(id: Id, data: Data, params?: Params): Promise<Data> {
    if (typeof data === 'string') {
      throw new BadRequest();
    }
    try {
      const target = id as string;
      await this.request.put(target, data);
      const resp = await this.request.get(target, data);
      return InnerSysVault.selectResponse(resp, params);
    } catch (e: any) {
      throw toHttpError(e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _patch(id: Id, data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _remove(id: Id, params?: Params): Promise<Data> {
    const target = id as string;
    try {
      await this.request.delete(target);
      return { id: id.toString() };
    } catch (e: any) {
      throw toHttpError(e);
    }
  }
}

const docs: ServiceSwaggerOptions = {
  operations: {
    get: false,
    create: false,
    update: false,
    patch: false,
    remove: false,
  },
  securities: ['all'],
};

export class SysVault {
  adapter: InnerSysVault;

  docs: ServiceSwaggerOptions = docs;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    this.adapter = new InnerSysVault(options, app);
  }

  async find(params?: Params): Promise<Data[] | Paginated<Data>> {
    return this.adapter.find(params);
  }

  async get(id: Id, params?: Params): Promise<Data> {
    return this.adapter.get(id, params);
  }

  async create(data: Data, params?: Params): Promise<Data> {
    const ret = await this.adapter.create(data, params);
    if (ret instanceof Array) {
      throw new GeneralError();
    }
    return ret;
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
