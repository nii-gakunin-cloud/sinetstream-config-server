import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.text('avatar');
  });
  await knex('users').update({
    avatar: knex.raw('\'https://www.gravatar.com/avatar/\' || md5(coalesce("email", "name")) || \'\\?d=identicon\''),
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('avatar');
  });
}
