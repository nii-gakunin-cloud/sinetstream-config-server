import { Service, ObjectionServiceOptions } from 'feathers-objection';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

interface Options extends ObjectionServiceOptions {
  Model: any;
}

const docs: ServiceSwaggerOptions = {
  description: 'ユーザパラメータのサービス',
  securities: ['all'],
  operations: {
    update: false,
  },
  definitions: {
    'user-parameters': {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        isBinary: {
          type: 'boolean',
          description: 'バイナリフラグ',
        },
        secret: {
          type: 'boolean',
          description: '秘匿情報フラグ',
        },
        stream_id: {
          type: 'integer',
          description: 'コンフィグ情報ID',
        },
        target: {
          type: 'string',
          description: '埋め込み位置指定',
        },
        enabled: {
          type: 'boolean',
          description: '有効フラグ',
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
        updatedAt: {
          type: 'string',
          description: '更新日時',
          format: 'date-time',
        },
        createdUser: {
          type: 'integer',
          description: '作成ユーザID',
        },
        updatedUser: {
          type: 'integer',
          description: '更新ユーザID',
        },
      },
    },
    'user-parameters_list': {
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
                $ref: '#/components/schemas/user-parameters',
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/user-parameters',
          },
        },
      ],
    },
  },
};

export class UserParameters extends Service {
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
