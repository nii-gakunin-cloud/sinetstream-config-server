import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'CREATE VIEW encrypt_key_versions (sid, tgt, ver) AS '
  + 'SELECT stream_id, target, max(version) FROM encrypt_keys GROUP BY (stream_id, target)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('drop view encrypt_key_versions');
}
