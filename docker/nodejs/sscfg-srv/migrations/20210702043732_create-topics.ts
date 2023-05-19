import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('topics', (table) => {
    table.increments('id');
    table.text('name').notNullable();
    table.integer('stream_id').unsigned().notNullable().references('id')
      .inTable('streams')
      .onDelete('cascade');
    table.unique(['stream_id', 'name']);
  })
    .then(() => console.log('Created topics table')) // eslint-disable-line no-console
    .catch((e) => console.error('Error creating topics table', e)); // eslint-disable-line no-console
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('topics');
}
