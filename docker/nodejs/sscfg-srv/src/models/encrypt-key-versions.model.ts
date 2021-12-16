import { JSONSchema, Model } from 'objection';

export class EncryptKeyVersions extends Model {
  static get tableName(): string {
    return 'encrypt_key_versions';
  }

  static get idColumn(): string[] {
    return ['sid', 'tgt'];
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: [],

      properties: {
        sid: { type: 'integer' },
        tgt: { type: 'string' },
        ver: { type: 'integer' },
      },
    };
  }
}
