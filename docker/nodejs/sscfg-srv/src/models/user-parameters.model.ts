import { JSONSchema, Model } from 'objection';
import { Application } from '../declarations';
import { Streams } from './streams.model';
import { Users } from './users.model';

export class UserParameters extends Model {
  id!: number;

  createdAt!: string;

  updatedAt!: string;

  target!: string;

  enabled!: boolean;

  secret!: boolean;

  comment?: string;

  isBinary!: boolean;

  textContent?: string;

  static get tableName(): string {
    return 'user_parameters';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['target', 'stream_id'],

      properties: {
        enabled: { type: 'boolean', default: true },
        isBinary: { type: 'boolean', default: true },
      },
    };
  }

  static relationMappings = {
    stream: {
      relation: Model.BelongsToOneRelation,
      modelClass: Streams,
      join: {
        from: 'user_parameters.stream_id',
        to: 'streams.id',
      },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: Users,
      join: {
        from: 'user_parameters.user_id',
        to: 'users.id',
      },
    },
  };

  $beforeInsert(): void {
    const now = new Date().toISOString();
    this.createdAt = now;
    this.updatedAt = now;
  }

  $beforeUpdate(): void {
    this.updatedAt = new Date().toISOString();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function (app: Application): typeof UserParameters {
  return UserParameters;
}
