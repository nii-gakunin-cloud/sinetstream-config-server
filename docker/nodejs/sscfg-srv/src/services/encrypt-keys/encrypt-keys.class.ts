import { ObjectionServiceOptions, Service } from 'feathers-objection';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

interface Options extends ObjectionServiceOptions {
  Model: any;
}

const docs: ServiceSwaggerOptions = {
  description: 'データ暗号鍵のサービス',
  securities: ['all'],
  operations: {
    update: false,
  },
  definitions: {
    'encrypt-keys': {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        stream_id: {
          type: 'integer',
          description: 'コンフィグ情報ID',
        },
        target: {
          type: 'string',
          description: '埋め込み位置指定',
        },
        version: {
          type: 'integer',
          description: '鍵のバージョン',
        },
        enabled: {
          type: 'boolean',
          description: '有効フラグ',
        },
        size: {
          type: 'integer',
          description: '鍵サイズ',
        },
        comment: {
          type: 'string',
          description: 'コメント',
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
        latest: {
          type: 'boolean',
          description: '最新キーフラグ',
        },
      },
    },
    'encrypt-keys_list': {
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
                $ref: '#/components/schemas/encrypt-keys',
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/encrypt-keys',
          },
        },
      ],
    },
  },
};

export class EncryptKeys extends Service {
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
