import { JSONSchema, Model } from 'objection';
import { Application } from '../declarations';
import { Users } from './users.model';

export class PublicKeys extends Model {
  id!: number;

  createdAt!: string;

  updatedAt!: string;

  [key: string]: any;

  static get tableName(): string {
    return 'public_keys';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['user_id'],

      properties: {
        fingerprint: { type: ['string', 'null'] },
        comment: { type: ['string', 'null'] },
        defaultKey: { type: ['boolean', 'null'] },
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
export default function (app: Application): typeof PublicKeys {
  return PublicKeys;
}
