import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('public_keys', (table) => {
    table.increments('id');

    table.text('fingerprint');
    table.text('comment');
    table.boolean('defaultKey').defaultTo(false);
    table.integer('user_id').unsigned().references('id').inTable('users');

    table.timestamp('createdAt');
    table.timestamp('updatedAt');
  })
    .then(() => console.log('Created public_keys table')) // eslint-disable-line no-console
    .catch((e) => console.error('Error creating public_keys table', e)); // eslint-disable-line no-console
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('public_keys');
}
