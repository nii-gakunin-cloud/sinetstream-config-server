import { JSONSchema, Model } from 'objection';
import { Application } from '../declarations';
import { Users } from './users.model';
import { Streams } from './streams.model';
import { AccessKeyExpirations } from './access-key-expirations.model';

export class AccessKeys extends Model {
  id!: number;

  createdAt!: string;

  allPermitted!: boolean;

  [key: string]: any;

  static get tableName(): string {
    return 'api_access_keys';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['user_id'],

      properties: {
        allPermitted: { type: 'boolean' },
        comment: { type: 'string' },
      },
    };
  }

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: Users,
      join: {
        from: 'public_keys.user_id',
        to: 'users.id',
      },
    },
    streams: {
      relation: Model.ManyToManyRelation,
      modelClass: Streams,
      join: {
        from: 'api_access_keys.id',
        through: {
          from: 'api_access_key_targets.api_access_key_id',
          to: 'api_access_key_targets.stream_id',
        },
        to: 'streams.id',
      },
    },
    expiration: {
      relation: Model.HasOneRelation,
      modelClass: AccessKeyExpirations,
      join: {
        from: 'api_access_keys.id',
        to: 'api_access_key_expirations.api_access_key_id',
      },
    },
  };

  $beforeInsert(): void {
    this.createdAt = new Date().toISOString();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function (app: Application): typeof AccessKeys {
  return AccessKeys;
}
