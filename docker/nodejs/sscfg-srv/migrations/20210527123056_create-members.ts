import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('members', (table) => {
    table.increments('id');

    table.integer('stream_id').unsigned().notNullable().references('id')
      .inTable('streams')
      .onDelete('cascade');
    table.integer('user_id').unsigned().notNullable().references('id')
      .inTable('users');
    table.unique(['stream_id', 'user_id']);

    table.boolean('admin').notNullable().defaultTo(false);

    table.timestamp('createdAt');
    table.timestamp('updatedAt');
    table.integer('createdUser').unsigned().references('id').inTable('users');
    table.integer('updatedUser').unsigned().references('id').inTable('users');
  })
    .then(() => console.log('Created members table')) // eslint-disable-line no-console
    .catch((e) => console.error('Error creating members table', e)); // eslint-disable-line no-console
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('members');
}
