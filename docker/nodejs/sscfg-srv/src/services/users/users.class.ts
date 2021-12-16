import { ObjectionServiceOptions, Service } from 'feathers-objection';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

interface Options extends ObjectionServiceOptions {
  Model: any;
}

const docs: ServiceSwaggerOptions = {
  securities: ['all'],
  operations: {
    update: false,
  },
  definitions: {
    users: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
        },
        name: {
          type: 'string',
          description: 'ユーザ名',
          maxLength: 255,
        },
        email: {
          type: 'string',
          description: 'メールアドレス',
          format: 'email',
        },
        displayName: {
          type: 'string',
          description: '表示名',
        },
        avatar: {
          type: 'string',
          description: 'アバター',
          format: 'uri',
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
        isLocalUser: {
          type: 'boolean',
        },
        deleted: {
          type: 'boolean',
          default: false,
        },
      },
    },
    users_list: {
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
                $ref: '#/components/schemas/users',
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/users',
          },
        },
      ],
    },
  },
};

export class Users extends Service {
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
