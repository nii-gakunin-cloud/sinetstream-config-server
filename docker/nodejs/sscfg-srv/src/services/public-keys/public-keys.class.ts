import { Service, ObjectionServiceOptions } from 'feathers-objection';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

interface Options extends ObjectionServiceOptions {
  Model: any;
}

const docs: ServiceSwaggerOptions = {
  description: 'ユーザ公開鍵のサービス',
  securities: ['all'],
  operations: {
    update: false,
  },
  definitions: {
    'public-keys': {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        fingerprint: {
          type: 'string',
        },
        comment: {
          type: 'string',
        },
        defaultKey: {
          type: 'boolean',
        },
        createdAt: {
          type: 'string',
          description: '作成日時',
          format: 'date-time',
        },
        updatedAt: {
          type: 'string',
          description: '更新日時',
          format: 'date-time',
        },
      },
    },
    'public-keys_list': {
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
                $ref: '#/components/schemas/public-keys',
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/public-keys',
          },
        },
      ],
    },
  },
};

export class PublicKeys extends Service {
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
