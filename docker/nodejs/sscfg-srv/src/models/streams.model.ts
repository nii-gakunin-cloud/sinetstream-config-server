import { JSONSchema, Model, RelationMappings } from 'objection';
import { Application } from '../declarations';
import { Topics } from './topics.model';

export class Streams extends Model {
  id!: number;

  name!: string;

  createdAt!: string;

  updatedAt!: string;

  [key: string]: any;

  static get tableName(): string {
    return 'streams';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['name'],

      properties: {
        name: { type: 'string', maxLength: 255 },
        configFile: { type: ['string', 'null'] },
        comment: { type: ['string', 'null'] },
      },
    };
  }

  static get modelPaths(): string[] {
    return [__dirname];
  }

  static relationMappings(): RelationMappings {
    return {
      members: {
        relation: Model.HasManyRelation,
        modelClass: 'members.model',
        join: {
          from: 'streams.id',
          to: 'members.stream_id',
        },
      },
      topics: {
        relation: Model.HasManyRelation,
        modelClass: Topics,
        join: {
          from: 'streams.id',
          to: 'topics.stream_id',
        },
      },
      /*
      encryptKeys: {
        relation: Model.HasManyRelation,
        modelClass: 'encrypt-keys.model',
        join: {
          from: 'streams.id',
          to: 'encrypt_keys.stream_id',
        },
      },
      attachFiles: {
        relation: Model.HasManyRelation,
        modelClass: 'attach-files.model',
        join: {
          from: 'streams.id',
          to: 'attach_files.stream_id',
        },
      },
      userParameters: {
        relation: Model.HasManyRelation,
        modelClass: 'user-parameters.model',
        join: {
          from: 'streams.id',
          to: 'user_parameters.stream_id',
        },
      },
      */
    };
  }

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
export default function (app: Application): typeof Streams {
  return Streams;
}
