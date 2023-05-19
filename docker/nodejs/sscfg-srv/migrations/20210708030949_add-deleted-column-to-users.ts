import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable('users', (table) => {
      table.dropUnique(['name']);
      table.dropUnique(['approle']);
      table.boolean('deleted').defaultTo(false);
    })
    .raw('CREATE UNIQUE INDEX users_name_unique ON "users" USING btree (name) WHERE NOT deleted')
    .raw('CREATE UNIQUE INDEX users_approle_unique ON "users" USING btree (approle) WHERE NOT deleted');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable('users', (table) => {
      table.dropIndex(['name'], 'users_name_unique');
      table.dropIndex(['approle'], 'users_approle_unique');
    })
    .alterTable('users', (table) => {
      table.dropColumn('deleted');
      table.unique(['name']);
      table.unique(['approle']);
    });
}
