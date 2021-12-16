import { JSONSchema, Model } from 'objection';
import { Application } from '../declarations';

export class Users extends Model {
  id!: number;

  createdAt!: string;

  updatedAt!: string;

  [key: string]: any;

  static get tableName(): string {
    return 'users';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', maxLength: 255 },
        email: { type: ['string', 'null'] },
        displayName: { type: ['string', 'null'] },
        password: { type: ['string', 'null'] },
        systemAdmin: { type: 'boolean', default: false },
      },
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
export default function (app: Application): typeof Users {
  return Users;
}
