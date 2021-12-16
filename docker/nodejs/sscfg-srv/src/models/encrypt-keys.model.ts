import { JSONSchema, Model } from 'objection';
import { Application } from '../declarations';
import { Streams } from './streams.model';
import { Users } from './users.model';
import { EncryptKeyVersions } from './encrypt-key-versions.model';

export class EncryptKeys extends Model {
  id!: number;

  createdAt!: string;

  updatedAt!: string;

  version?: number;

  comment?: string;

  enabled!: boolean;

  latestVersion?: {ver: number};

  static get tableName(): string {
    return 'encrypt_keys';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['target', 'size', 'stream_id'],

      properties: {
        enabled: { type: 'boolean', default: true },
      },
    };
  }

  static get virtualAttributes(): string[] {
    return ['latest'];
  }

  get latest(): boolean {
    return this.version === this.latestVersion?.ver;
  }

  static relationMappings = {
    stream: {
      relation: Model.BelongsToOneRelation,
      modelClass: Streams,
      join: {
        from: 'encrypt_keys.stream_id',
        to: 'streams.id',
      },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: Users,
      join: {
        from: 'encrypt_keys.createdUser',
        to: 'users.id',
      },
    },
    latestVersion: {
      relation: Model.BelongsToOneRelation,
      modelClass: EncryptKeyVersions,
      join: {
        from: ['encrypt_keys.target', 'encrypt_keys.stream_id'],
        to: ['encrypt_key_versions.tgt', 'encrypt_key_versions.sid'],
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
export default function (app: Application): typeof EncryptKeys {
  return EncryptKeys;
}
