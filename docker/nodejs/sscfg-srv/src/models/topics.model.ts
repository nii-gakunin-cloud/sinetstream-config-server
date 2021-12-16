import { JSONSchema, Model } from 'objection';
import { Application } from '../declarations';

export class Topics extends Model {
  static get tableName(): string {
    return 'topics';
  }

  static get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: [],

      properties: {
        name: { type: 'string' },
      },
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function (app: Application): typeof Topics {
  return Topics;
}
