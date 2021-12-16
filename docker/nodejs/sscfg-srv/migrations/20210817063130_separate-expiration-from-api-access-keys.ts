import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('api_access_keys', (table) => {
    table.dropColumn('expirationTime');
  });

  await knex.schema.createTable('api_access_key_expirations', (table) => {
    table.increments('id');
    table.integer('api_access_key_id').unsigned().notNullable().references('id')
      .inTable('api_access_keys')
      .onDelete('cascade');
    table.timestamp('expirationTime').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('api_access_key_expirations');
  await knex.schema.alterTable('api_access_keys', (table) => {
    table.timestamp('expirationTime');
  });
}
