/* eslint-disable no-underscore-dangle */
/* eslint max-classes-per-file: ["error", 2] */
import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { MethodNotAllowed } from '@feathersjs/errors';
import {
  Id, NullableId, Paginated, Params, ServiceAddons, ServiceMethods,
} from '@feathersjs/feathers';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';
import { docs, PublicKeys } from '../public-keys/public-keys.class';

type Data = Record<string, any>;

class InnerApiV1PublicKeys extends AdapterService<Data> implements ServiceMethods<Data> {
  app: Application;

  service: PublicKeys & ServiceAddons<any>;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    super(options);
    this.app = app;
    this.service = app.service('public-keys');
  }

  async _find(params?: Params): Promise<Data[] | Paginated<Data>> {
    return this.service.find(params);
  }

  async _get(id: Id, params?: Params): Promise<Data> {
    return this.service.get(id, params);
  }

  async _create(data: Data, params?: Params): Promise<Data> {
    const { defaultKey, ...other } = data;
    const data1 = defaultKey != null ? data : { defaultKey: true, ...other };
    return this.service.create(data1, params);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _update(id: Id, data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  async _patch(id: Id, data: Data, params?: Params): Promise<Data> {
    return this.service.patch(id, data, params);
  }

  async _remove(id: NullableId, params?: Params): Promise<Data> {
    return this.service.remove(id, params);
  }
}

export class ApiV1PublicKeys {
  adapter: InnerApiV1PublicKeys;

  docs: ServiceSwaggerOptions;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    this.adapter = new InnerApiV1PublicKeys(options, app);
    this.docs = docs;
  }

  async find(params?: Params): Promise<Data[] | Paginated<Data>> {
    return this.adapter.find(params);
  }

  async get(id: Id, params?: Params): Promise<Data> {
    return this.adapter.get(id, params);
  }

  async create(data: Data, params?: Params): Promise<Data> {
    return this.adapter.create(data, params);
  }

  async patch(id: Id, data: Partial<Data>, params?: Params): Promise<Data> {
    return this.adapter.patch(id, data, params);
  }

  async remove(id: NullableId, params?: Params): Promise<Data> {
    return this.adapter.remove(id, params);
  }

  get id(): string {
    return this.adapter.id;
  }

  get events(): string[] {
    return this.adapter.events;
  }
}
