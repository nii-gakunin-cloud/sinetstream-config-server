import { JSONSchema, Model } from 'objection';
import { Application } from '../declarations';
import { Streams } from './streams.model';
import { Users } from './users.model';

export class AttachFiles extends Model {
  id!: number;

  createdAt!: string;

  updatedAt!: string;

  target!: string;

  enabled!: boolean;

  secret!: boolean;

  comment?: string;

  static get tableName(): string {
    return 'attach_files';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['target', 'stream_id'],

      properties: {
        enabled: { type: 'boolean', default: true },
      },
    };
  }

  static relationMappings = {
    stream: {
      relation: Model.BelongsToOneRelation,
      modelClass: Streams,
      join: {
        from: 'attach_files.stream_id',
        to: 'streams.id',
      },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: Users,
      join: {
        from: 'attach_files.updatedUser',
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
export default function (app: Application): typeof AttachFiles {
  return AttachFiles;
}
