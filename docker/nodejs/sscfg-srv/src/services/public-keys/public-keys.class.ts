import { Service, ObjectionServiceOptions } from 'feathers-objection';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';

interface Options extends ObjectionServiceOptions {
  Model: any;
}

export const docs: ServiceSwaggerOptions = {
  description: 'ユーザ公開鍵のサービス',
  securities: ['all'],
  modelName: 'public-keys_v1',
  refs: {
    createRequest: 'public-keys_v1_create_request_body',
    patchRequest: 'public-keys_v1_patch_request_body',
    filterParameter: 'public-keys_v1_filter',
  },
  operations: {
    update: false,
  },
  multi: ['remove'],
  definitions: {
    'public-keys_v1': {
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
    'public-keys_v1_filter': {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        fingerprint: {
          $ref: '#/components/schemas/public-keys_v1_filter_like',
        },
        comment: {
          $ref: '#/components/schemas/public-keys_v1_filter_like',
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
    'public-keys_v1_filter_like': {
      oneOf: [
        {
          type: 'string',
        },
        {
          type: 'object',
          properties: {
            $like: {
              type: 'string',
            },
          },
        },
      ],
    },
    'public-keys_v1_list': {
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
                $ref: '#/components/schemas/public-keys_v1_list',
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/public-keys_v1_list',
          },
        },
      ],
    },
    'public-keys_v1_create_request_body': {
      type: 'object',
      required: ['publicKey'],
      properties: {
        publicKey: {
          type: 'string',
          description: '公開鍵',
        },
        comment: {
          type: 'string',
        },
        defaultKey: {
          type: 'boolean',
        },
      },
    },
    'public-keys_v1_patch_request_body': {
      type: 'object',
      properties: {
        comment: {
          type: 'string',
        },
        defaultKey: {
          type: 'boolean',
        },
      },
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
