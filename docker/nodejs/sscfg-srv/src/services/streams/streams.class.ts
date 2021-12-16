import { Service, ObjectionServiceOptions } from 'feathers-objection';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

interface Options extends ObjectionServiceOptions {
  Model: any;
}

const docs: ServiceSwaggerOptions = {
  description: 'コンフィグ情報のサービス',
  securities: ['all'],
  operations: {
    update: false,
  },
  definitions: {
    streams: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: {
          type: 'string',
          description: 'コンフィグ情報名',
        },
        configFile: {
          type: 'string',
          description: 'SINETStream設定ファイル',
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
      },
    },
    streams_list: {
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
                $ref: '#/components/schemas/streams',
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/streams',
          },
        },
      ],
    },
  },
};

export class Streams extends Service {
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
