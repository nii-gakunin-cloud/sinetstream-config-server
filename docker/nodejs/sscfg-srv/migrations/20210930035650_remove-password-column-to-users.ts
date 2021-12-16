import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable('users', (table) => {
      table.dropColumn('password');
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable('users', (table) => {
      table.string('password');
    });
}
