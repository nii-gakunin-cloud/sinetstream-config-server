import { Service, ObjectionServiceOptions } from 'feathers-objection';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

interface Options extends ObjectionServiceOptions {
  Model: any;
}

const docs: ServiceSwaggerOptions = {
  description: 'アクセスキーのサービス',
  securities: ['all'],
  operations: {
    update: false,
  },
  definitions: {
    'access-keys': {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        allPermitted: {
          type: 'boolean',
          description: '',
        },
        comment: {
          type: 'string',
          description: 'コメント',
        },
        user_id: {
          type: 'integer',
          description: 'ユーザID',
        },
        createdAt: {
          type: 'string',
          description: '作成日時',
          format: 'date-time',
        },
        expirationTime: {
          type: 'string',
          description: '有効期限',
          format: 'date-time',
        },
        roleId: {
          type: 'string',
          description: 'ロールID',
        },
        secretId: {
          type: 'string',
          description: 'シークレットID',
        },
      },
    },
    'access-keys_list': {
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
                $ref: '#/components/schemas/access-keys',
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/access-keys',
          },
        },
      ],
    },
  },
};
export class AccessKeys extends Service {
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
