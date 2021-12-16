import { JSONSchema, Model } from 'objection';
import { Application } from '../declarations';
import { Streams } from './streams.model';
import { Users } from './users.model';

export class Members extends Model {
  id!: number;

  admin!: boolean;

  createdAt!: string;

  updatedAt!: string;

  static get tableName(): string {
    return 'members';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: [],

      properties: {
        admin: { type: 'boolean', default: false },
      },
    };
  }

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: Users,
      join: {
        from: 'members.user_id',
        to: 'users.id',
      },
    },
    stream: {
      relation: Model.BelongsToOneRelation,
      modelClass: Streams,
      join: {
        from: 'members.stream_id',
        to: 'streams.id',
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
export default function (app: Application): typeof Members {
  return Members;
}
