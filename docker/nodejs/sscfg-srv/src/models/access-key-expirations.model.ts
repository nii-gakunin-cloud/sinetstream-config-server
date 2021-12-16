import { JSONSchema, Model } from 'objection';
import { Application } from '../declarations';

export class AccessKeyExpirations extends Model {
  static get tableName(): string {
    return 'api_access_key_expirations';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['expirationTime'],
      properties: {},
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function (app: Application): typeof AccessKeyExpirations {
  return AccessKeyExpirations;
}
