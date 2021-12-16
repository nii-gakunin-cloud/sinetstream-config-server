import * as Knex from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex('users')
    .where('deleted', '=', false)
    .count('id');
  if (Number(count) > 0) {
    return;
  }

  const now = new Date().toISOString();
  const name = process.env.ADMIN_NAME != null
    ? process.env.ADMIN_NAME : 'admin';
  await knex('users').insert({
    name,
    systemAdmin: true,
    createdAt: now,
    updatedAt: now,
  });
}
