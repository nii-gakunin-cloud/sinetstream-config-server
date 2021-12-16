import { Service, ObjectionServiceOptions } from 'feathers-objection';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

interface Options extends ObjectionServiceOptions {
  Model: any;
}

const docs: ServiceSwaggerOptions = {
  description: '添付ファイルのサービス',
  securities: ['all'],
  operations: {
    update: false,
  },
  definitions: {
    'attach-files': {
      type: 'object',
      properties: {
        id: { type: 'integer' },
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
    'attach-files_list': {
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
                $ref: '#/components/schemas/attach-files',
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/attach-files',
          },
        },
      ],
    },
  },
};
export class AttachFiles extends Service {
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
