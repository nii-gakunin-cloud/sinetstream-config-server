import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('encrypt_keys', (table) => {
    table.increments('id');

    table.integer('stream_id').unsigned().notNullable().references('id')
      .inTable('streams')
      .onDelete('cascade');

    table.text('target').notNullable();
    table.integer('version').notNullable().unsigned();
    table.unique(['stream_id', 'target', 'version']);

    table.boolean('enabled').notNullable().defaultTo(true);
    table.integer('size').notNullable().unsigned();
    table.text('comment');

    table.timestamp('createdAt');
    table.timestamp('updatedAt');
    table.integer('createdUser').unsigned().references('id').inTable('users');
    table.integer('updatedUser').unsigned().references('id').inTable('users');
  })
    .then(() => console.log('Created encrypt-keys table')) // eslint-disable-line no-console
    .catch((e) => console.error('Error creating encrypt-keys table', e)); // eslint-disable-line no-console
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('encrypt_keys');
}
