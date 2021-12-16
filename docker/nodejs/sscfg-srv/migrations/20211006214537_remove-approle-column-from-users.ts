import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable('users', (table) => {
      table.dropColumn('approle');
      table.boolean('isLocalUser').defaultTo(true);
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable('users', (table) => {
      table.dropColumn('isLocalUser');
      table.text('approle');
    })
    .raw('CREATE UNIQUE INDEX users_approle_unique ON "users" USING btree (approle) WHERE NOT deleted');
}
