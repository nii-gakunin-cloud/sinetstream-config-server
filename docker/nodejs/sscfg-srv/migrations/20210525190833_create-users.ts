import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id');

    table.string('name').notNullable().unique();
    table.string('password');

    table.text('email');
    table.text('displayName');

    table.timestamp('createdAt');
    table.timestamp('updatedAt');
  })
    .then(() => console.log('Created users table')) // eslint-disable-line no-console
    .catch((e) => console.error('Error creating users table', e)); // eslint-disable-line no-console
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
}
