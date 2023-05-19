import { BadRequest } from '@feathersjs/errors';
import { Knex } from 'knex';
import app from '../../src/app';
import { Users } from '../../src/models/users.model';

describe('\'stream-names\' service', () => {
  let db: Knex;
  const service = app.service('stream-names');
  const name1 = 'config-001';
  const name2 = 'config-002';
  const name3 = 'config-003';
  let user: Users;
  let otherUser: Users;

  describe('検索', () => {
    it('存在している名前の場合', async () => {
      expect.assertions(1);
      const res = await service.find({ query: { name: name1 }, user });
      expect(res.total).toBe(1);
    });

    it('他のユーザが登録した名前の場合', async () => {
      expect.assertions(1);
      const res = await service.find({ query: { name: name1 }, user });
      expect(res.total).toBe(1);
    });

    it('存在していない名前の場合', async () => {
      expect.assertions(1);
      const res = await service.find({ query: { name: name3 }, user });
      expect(res.total).toBe(0);
    });

    beforeEach(async () => {
      await db('streams').del();
      const streams = app.service('streams');
      const test = { jest: true };
      await streams.create({ name: name1 }, { user, test });
      await streams.create({ name: name2 }, { user: otherUser, test });
    });
  });

  describe('異常系', () => {
    it('queryを指定していない', async () => {
      expect.assertions(1);
      await expect(async () => {
        await service.find();
      }).rejects.toThrowError(BadRequest);
    });

    it('nameを指定していない', async () => {
      expect.assertions(1);
      await expect(async () => {
        await service.find({ query: {} });
      }).rejects.toThrowError(BadRequest);
    });
  });

  const userInfo = {
    name: 'admin@example.com',
  };
  const otherUserInfo = {
    name: 'other@example.com',
  };

  beforeAll(async () => {
    db = app.get('knex');
    await db('streams').del();
    await db('users').del();
    await db('users').insert(userInfo);
    await db('users').insert(otherUserInfo);
    [user] = ((await app.service('users').find({ query: { name: userInfo.name } })) as Users[]);
    [otherUser] = ((await app.service('users').find({ query: { name: otherUserInfo.name } })) as Users[]);
  });

  afterAll(async () => {
    await db('streams').del();
    await db('users').del();
  });
});
