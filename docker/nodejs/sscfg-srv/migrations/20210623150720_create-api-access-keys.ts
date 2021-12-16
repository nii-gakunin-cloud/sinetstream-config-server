import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('api_access_keys', (table) => {
    table.increments('id');
    table.boolean('allPermitted').defaultTo(true);
    table.text('comment');
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.timestamp('createdAt');
    table.timestamp('expirationTime');
  })
    .then(() => console.log('Created api_access_keys table')) // eslint-disable-line no-console
    .catch((e) => console.error('Error creating api_access_keys table', e)); // eslint-disable-line no-console

  await knex.schema.createTable('api_access_key_targets', (table) => {
    table.integer('api_access_key_id').unsigned().notNullable().references('id')
      .inTable('api_access_keys')
      .onDelete('cascade');
    table.integer('stream_id').unsigned().notNullable().references('id')
      .inTable('streams')
      .onDelete('cascade');
    table.unique(['api_access_key_id', 'stream_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('api_access_key_targets');
  await knex.schema.dropTable('api_access_keys');
}
