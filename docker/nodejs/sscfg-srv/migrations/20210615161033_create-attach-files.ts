import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('attach_files', (table) => {
    table.increments('id');

    table.binary('content');
    table.boolean('secret').notNullable().defaultTo(false);

    table.integer('stream_id').unsigned().notNullable().references('id')
      .inTable('streams')
      .onDelete('cascade');
    table.text('target').notNullable();
    table.boolean('enabled').notNullable().defaultTo(true);
    table.text('comment');

    table.timestamp('createdAt');
    table.timestamp('updatedAt');
    table.integer('createdUser').unsigned().references('id').inTable('users');
    table.integer('updatedUser').unsigned().references('id').inTable('users');
  })
    .then(() => console.log('Created attach-files table')) // eslint-disable-line no-console
    .catch((e) => console.error('Error creating attach-files table', e)); // eslint-disable-line no-console
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('attach_files');
}
