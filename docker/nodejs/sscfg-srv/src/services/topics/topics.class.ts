import { ObjectionServiceOptions, Service } from 'feathers-objection';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

interface Options extends ObjectionServiceOptions {
  Model: any;
}

const docs: ServiceSwaggerOptions = {
  description: 'トピック名のサービス',
  securities: ['all'],
  operations: {
    create: false,
    update: false,
    patch: false,
    remove: false,
  },
  definitions: {
    topics: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: {
          type: 'string',
          description: 'トピック名',
        },
        stream_id: {
          type: 'integer',
          description: 'コンフィグ情報ID',
        },
      },
    },
    topics_list: {
      oneOf: [
        {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
            },
            limit: {
              type: 'integer',
            },
            skip: {
              type: 'integer',
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/topics',
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/topics',
          },
        },
      ],
    },
  },
};

export class Topics extends Service {
  docs: ServiceSwaggerOptions;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<Options>, app: Application) {
    const { Model, ...otherOptions } = options;

    super({
      ...otherOptions,
      model: Model,
    });
    this.docs = docs;
  }
}
