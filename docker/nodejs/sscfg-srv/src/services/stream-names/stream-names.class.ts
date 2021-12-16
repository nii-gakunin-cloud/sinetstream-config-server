/* eslint-disable no-underscore-dangle */
/* eslint max-classes-per-file: ["error", 2] */
import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { BadRequest, GeneralError, MethodNotAllowed } from '@feathersjs/errors';
import {
  Id, Paginated, Params, ServiceMethods,
} from '@feathersjs/feathers';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

type Data = Record<string, string>;

class InnerStreamNames extends AdapterService<Data> implements ServiceMethods<Data> {
  app: Application;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async _find(params?: Params): Promise<Paginated<Data>> {
    const { query } = params ?? {};
    const { name } = query ?? {};
    if (name == null) {
      throw new BadRequest();
    }

    const service = this.app.service('streams');
    const paginate = { default: 1, max: 1 };
    const res = await service.find({ query: { name, $limit: 0 }, paginate });
    if (res instanceof Array) {
      throw new GeneralError();
    }
    return res;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _get(id: Id, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
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
  description: 'コンフィグ情報名のサービス',
  securities: ['all'],
};

export class StreamNames {
  adapter: InnerStreamNames;

  docs: ServiceSwaggerOptions = docs;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    this.adapter = new InnerStreamNames(options, app);
  }

  async find(params?: Params): Promise<Paginated<Data>> {
    const res = await this.adapter.find(params);
    if (res instanceof Array) {
      throw new GeneralError();
    }
    return res;
  }

  get id(): string {
    return this.adapter.id;
  }

  get events(): string[] {
    return this.adapter.events;
  }
}
