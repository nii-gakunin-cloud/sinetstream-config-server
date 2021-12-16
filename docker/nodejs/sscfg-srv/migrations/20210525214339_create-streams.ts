import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('streams', (table) => {
    table.increments('id');

    table.string('name').notNullable().unique();
    table.text('configFile');
    table.text('comment');

    table.timestamp('createdAt');
    table.timestamp('updatedAt');
    table.integer('createdUser').unsigned().references('id').inTable('users');
    table.integer('updatedUser').unsigned().references('id').inTable('users');
  })
    .then(() => console.log('Created streams table')) // eslint-disable-line no-console
    .catch((e) => console.error('Error creating streams table', e)); // eslint-disable-line no-console
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('streams');
}
