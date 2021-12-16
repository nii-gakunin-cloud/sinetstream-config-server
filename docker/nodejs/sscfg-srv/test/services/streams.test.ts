/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import {
  BadRequest, Conflict, Forbidden, MethodNotAllowed, NotFound,
} from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import knex from 'knex';
import app from '../../src/app';
import { Streams } from '../../src/models/streams.model';
import { Users } from '../../src/models/users.model';

describe('\'streams\' service', () => {
  let db: knex;
  const service = app.service('streams');

  let user: Users;
  let user1: Users;
  let otherUser: Users;
  let params: Params;
  const name = 'config-001';
  const comment = 'config comment';
  const configFile = `
kafka-service:
  type: kafka
  brokers: kafka0.example.org
  topic: topic-kafka-001
  `;

  describe('コンフィグ情報を登録する', () => {
    it('名前だけを指定する', async () => {
      expect.assertions(12);
      const stream = await service.create({ name }, params);
      expect(stream.id).not.toBeNull();
      expect(stream.name).toBe(name);
      expect(stream.comment).toBeNull();
      expect(stream.configFile).toBeNull();
      expect(stream.createdAt).not.toBeNull();
      expect(stream.updatedAt).toEqual(stream.createdAt);
      expect(stream.createdUser).toBe(user.id);
      expect(stream.updatedUser).toBe(user.id);

      // 登録したユーザがデータ管理者となっていることを確認する
      expect(stream.admin).toBe(true);
      if (stream.members instanceof Array) {
        expect(stream.members.length).toBe(1);
        expect(stream.members[0].user_id).toBe(user.id);
        expect(stream.members[0].admin).toBe(true);
      }
    });

    it('名前とコメント、設定ファイルを指定する', async () => {
      expect.assertions(12);
      const stream = await service.create({ name, comment, configFile }, params);
      expect(stream.id).not.toBeNull();
      expect(stream.name).toBe(name);
      expect(stream.comment).toBe(comment);
      expect(stream.configFile).toBe(configFile);
      expect(stream.createdAt).not.toBeNull();
      expect(stream.updatedAt).toEqual(stream.createdAt);
      expect(stream.createdUser).toBe(user.id);
      expect(stream.updatedUser).toBe(user.id);

      // 登録したユーザがデータ管理者となっていることを確認する
      expect(stream.admin).toBe(true);
      if (stream.members instanceof Array) {
        expect(stream.members.length).toBe(1);
        expect(stream.members[0].user_id).toBe(user.id);
        expect(stream.members[0].admin).toBe(true);
      }
    });

    describe('異常系', () => {
      it('名前を指定していない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.create({ comment, configFile }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('名前に用いることのできない文字を指定している', async () => {
        expect.assertions(1);
        const badName = 'config=12';
        await expect(async () => {
          await service.create({ name: badName, comment, configFile }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('記号で開始する名前を指定している', async () => {
        expect.assertions(1);
        const badName = '-config-12';
        await expect(async () => {
          await service.create({ name: badName, comment, configFile }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('長すぎる名前を指定している', async () => {
        expect.assertions(2);
        const badName = 'abcdefgh'.repeat(32);
        expect(badName.length).toBe(256);
        await expect(async () => {
          await service.create({ name: badName, comment, configFile }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('既に登録済のコンフィグ情報と名前が重複している', async () => {
        expect.assertions(2);
        const res = await service.create({ name }, { ...params });
        expect(res).toBeTruthy();
        await expect(async () => {
          await service.create({ name, comment, configFile }, params);
        }).rejects.toThrowError(Conflict);
      });
    });
  });

  describe('コンフィグ情報を変更する', () => {
    let stream: Streams;

    it('コメントを変更する', async () => {
      expect.assertions(3);
      const stream1 = await service.patch(stream.id, { comment }, params);
      const {
        comment: _comment, admin: _admin, members: _members,
        updatedAt: updatedAt0, ...streamParams0
      } = stream;
      const {
        comment: comment1, updatedAt: updatedAt1, topics: _topics, ...streamParams1
      } = stream1;
      expect(comment1).toBe(comment);
      expect(updatedAt1).not.toEqual(updatedAt0);
      expect(streamParams1).toEqual(streamParams0);
    });

    it('設定ファイルを変更する', async () => {
      expect.assertions(3);
      const stream1 = await service.patch(stream.id, { configFile }, params);
      const {
        configFile: _configFile, admin: _admin, members: _members,
        updatedAt: updatedAt0, ...streamParams0
      } = stream;
      const {
        configFile: configFile1, updatedAt: updatedAt1,
        topics: _topics,
        ...streamParams1
      } = stream1;
      expect(configFile1).toBe(configFile);
      expect(updatedAt1).not.toEqual(updatedAt0);
      expect(streamParams1).toEqual(streamParams0);
    });

    describe('異常系', () => {
      it('名前は変更できない', async () => {
        expect.assertions(1);
        const newName = `new-${name}`;
        await expect(async () => {
          await service.patch(stream.id, { name: newName }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('データ管理者でないユーザは変更できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.patch(stream.id, { comment }, { user: user1, test: params.test });
        }).rejects.toThrowError(Forbidden);
      });

      it('共同利用者でないユーザは操作できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.patch(stream.id, { comment }, { user: otherUser, test: params.test });
        }).rejects.toThrowError(Forbidden);
      });

      it('PUTでコンフィグ情報を変更することはできない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.update(stream.id, { name, comment }, params);
        }).rejects.toThrowError(MethodNotAllowed);
      });
    });

    beforeEach(async () => {
      stream = await service.create({ name }, { ...params });
      await db('members').insert({ user_id: user1.id, stream_id: stream.id });
    });
  });

  describe('コンフィグ情報を削除する', () => {
    let stream: Streams;

    it('削除の実行', async () => {
      expect.assertions(3);
      const ret = await service.remove(stream.id, { ...params });
      expect(ret).toBeTruthy();
      const res = await service.find({ ...params, query: { $limit: 0 } });
      if (!(res instanceof Array)) {
        expect(res.total).toBe(0);
      }

      // 関連するmembersのレコードが削除されるていること
      const res2 = await db('members').where('stream_id', stream.id);
      if (res2 instanceof Array) {
        expect(res2.length).toBe(0);
      }
    });

    describe('異常系', () => {
      it('データ管理者でないユーザは削除できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.remove(stream.id, { user: user1, test: params.test });
        }).rejects.toThrowError(Forbidden);
      });

      it('共同利用者でないユーザは操作できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.remove(stream.id, { user: otherUser, test: params.test });
        }).rejects.toThrowError(Forbidden);
      });
    });

    beforeEach(async () => {
      stream = await service.create({ name }, { ...params });
      await db('members').insert({ user_id: user1.id, stream_id: stream.id });
    });
  });

  describe('コンフィグ情報を取得する', () => {
    let stream: Streams;

    it('取得項目の確認', async () => {
      expect.assertions(9);
      const stream1 = await service.get(stream.id, params);
      expect(stream1.id).toBe(stream.id);
      expect(stream1.name).toBe(name);
      expect(stream1.comment).toBe(comment);
      expect(stream1.configFile).toBe(configFile);
      expect(stream1.createdAt).not.toBeNull();
      expect(stream1.updatedAt).toEqual(stream.createdAt);
      expect(stream1.createdUser).toBe(user.id);
      expect(stream1.updatedUser).toBe(user.id);
      expect(stream1.admin).toBeUndefined();
    });

    it('共同利用者による取得', async () => {
      expect.assertions(9);
      const stream1 = await service.get(stream.id, { user: user1, test: params.test });
      expect(stream1.id).toBe(stream.id);
      expect(stream1.name).toBe(name);
      expect(stream1.comment).toBe(comment);
      expect(stream1.configFile).toBe(configFile);
      expect(stream1.createdAt).not.toBeNull();
      expect(stream1.updatedAt).toEqual(stream.createdAt);
      expect(stream1.createdUser).toBe(user.id);
      expect(stream1.updatedUser).toBe(user.id);
      expect(stream1.admin).toBeUndefined();
    });

    describe('joinEagerの指定', () => {
      describe('memberの指定', () => {
        it('データ管理者による取得', async () => {
          expect.assertions(12);
          const stream1 = await service.get(
            stream.id, { ...params, query: { $joinEager: 'members' } },
          );
          expect(stream1.id).toBe(stream.id);
          expect(stream1.name).toBe(name);
          expect(stream1.comment).toBe(comment);
          expect(stream1.configFile).toBe(configFile);
          expect(stream1.createdAt).not.toBeNull();
          expect(stream1.updatedAt).toEqual(stream.createdAt);
          expect(stream1.createdUser).toBe(user.id);
          expect(stream1.updatedUser).toBe(user.id);
          expect(stream1.admin).toBe(true);
          if (stream1.members instanceof Array) {
            expect(stream1.members.length).toBe(2);
            expect(stream1.members).toContainEqual({ admin: true, user_id: user.id });
            expect(stream1.members).toContainEqual({ admin: false, user_id: user1.id });
          }
        });

        it('共同利用者による取得', async () => {
          expect.assertions(12);
          const stream1 = await service.get(
            stream.id, { user: user1, test: params.test, query: { $joinEager: 'members' } },
          );
          expect(stream1.id).toBe(stream.id);
          expect(stream1.name).toBe(name);
          expect(stream1.comment).toBe(comment);
          expect(stream1.configFile).toBe(configFile);
          expect(stream1.createdAt).not.toBeNull();
          expect(stream1.updatedAt).toEqual(stream.createdAt);
          expect(stream1.createdUser).toBe(user.id);
          expect(stream1.updatedUser).toBe(user.id);
          expect(stream1.admin).toBe(false);
          if (stream1.members instanceof Array) {
            expect(stream1.members.length).toBe(2);
            expect(stream1.members).toContainEqual({ admin: true, user_id: user.id });
            expect(stream1.members).toContainEqual({ admin: false, user_id: user1.id });
          }
        });
      });

      it('members.userの指定', async () => {
        expect.assertions(12);
        const stream1 = await service.get(
          stream.id, { ...params, query: { $joinEager: 'members.user' } },
        );
        expect(stream1.id).toBe(stream.id);
        expect(stream1.name).toBe(name);
        expect(stream1.comment).toBe(comment);
        expect(stream1.configFile).toBe(configFile);
        expect(stream1.createdAt).not.toBeNull();
        expect(stream1.updatedAt).toEqual(stream.createdAt);
        expect(stream1.createdUser).toBe(user.id);
        expect(stream1.updatedUser).toBe(user.id);
        expect(stream1.admin).toBe(true);
        if (stream1.members instanceof Array) {
          expect(stream1.members.length).toBe(2);
          const userAttrSelect = (u: {[key: string]: any}): {[key: string]: any} => {
            const { displayName, email, name: userName } = u;
            return { displayName, email, name: userName };
          };
          expect(stream1.members)
            .toContainEqual({ admin: true, user_id: user.id, user: userAttrSelect(user) });
          expect(stream1.members)
            .toContainEqual({ admin: false, user_id: user1.id, user: userAttrSelect(user1) });
        }
      });

      it('topicsの指定', async () => {
        expect.assertions(10);
        const stream1 = await service.get(
          stream.id, { ...params, query: { $joinEager: 'topics' } },
        );
        expect(stream1.id).toBe(stream.id);
        expect(stream1.name).toBe(name);
        expect(stream1.comment).toBe(comment);
        expect(stream1.configFile).toBe(configFile);
        expect(stream1.createdAt).not.toBeNull();
        expect(stream1.updatedAt).toEqual(stream.createdAt);
        expect(stream1.createdUser).toBe(user.id);
        expect(stream1.updatedUser).toBe(user.id);
        if (stream1.topics instanceof Array) {
          expect(stream1.topics.length).toBe(1);
          expect(stream1.topics[0].name).toBe('topic-kafka-001');
        }
      });
    });

    describe('異常系', () => {
      it('共同利用者でないと取得できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(stream.id, { user: otherUser, test: params.test });
        }).rejects.toThrowError(NotFound);
      });
    });

    beforeEach(async () => {
      stream = await service.create({ name, comment, configFile }, { ...params });
      await db('members').insert({ user_id: user1.id, stream_id: stream.id });
    });
  });

  describe('コンフィグ情報を検索する', () => {
    let stream: Streams;

    it('取得項目の確認', async () => {
      expect.assertions(10);
      const res = await service.find(params);
      if (res instanceof Array) {
        expect(res.length).toBe(1);
        const stream1 = res[0];
        expect(stream1.id).toBe(stream.id);
        expect(stream1.name).toBe(name);
        expect(stream1.comment).toBe(comment);
        expect(stream1.configFile).toBe(configFile);
        expect(stream1.createdAt).not.toBeNull();
        expect(stream1.updatedAt).toEqual(stream.createdAt);
        expect(stream1.createdUser).toBe(user.id);
        expect(stream1.updatedUser).toBe(user.id);
        expect(stream1.admin).toBeUndefined();
      }
    });

    it('共同利用者による取得', async () => {
      expect.assertions(10);
      const res = await service.find({ user: user1, test: params.test });
      if (res instanceof Array) {
        expect(res.length).toBe(1);
        const stream1 = res[0];
        expect(stream1.id).toBe(stream.id);
        expect(stream1.name).toBe(name);
        expect(stream1.comment).toBe(comment);
        expect(stream1.configFile).toBe(configFile);
        expect(stream1.createdAt).not.toBeNull();
        expect(stream1.updatedAt).toEqual(stream.createdAt);
        expect(stream1.createdUser).toBe(user.id);
        expect(stream1.updatedUser).toBe(user.id);
        expect(stream1.admin).toBeUndefined();
      }
    });

    it('共同利用者でないコンフィグ情報は取得できない', async () => {
      expect.assertions(1);
      const res = await service.find({ user: otherUser, test: params.test });
      if (res instanceof Array) {
        expect(res.length).toBe(0);
      }
    });

    it('limitの指定', async () => {
      expect.assertions(1);
      const res = await service.find({ ...params, query: { $limit: 0 } });
      if (!(res instanceof Array)) {
        expect(res.total).toBe(1);
      }
    });

    describe('joinEagerの指定', () => {
      describe('memberの指定', () => {
        it('データ管理者による検索', async () => {
          expect.assertions(13);
          const res = await service.find(
            { ...params, query: { $joinEager: 'members' } },
          );
          if (res instanceof Array) {
            expect(res.length).toBe(1);
            const stream1 = res[0];
            expect(stream1.id).toBe(stream.id);
            expect(stream1.name).toBe(name);
            expect(stream1.comment).toBe(comment);
            expect(stream1.configFile).toBe(configFile);
            expect(stream1.createdAt).not.toBeNull();
            expect(stream1.updatedAt).toEqual(stream.createdAt);
            expect(stream1.createdUser).toBe(user.id);
            expect(stream1.updatedUser).toBe(user.id);
            expect(stream1.admin).toBe(true);
            if (stream1.members instanceof Array) {
              expect(stream1.members.length).toBe(2);
              expect(stream1.members).toContainEqual({ admin: true, user_id: user.id });
              expect(stream1.members).toContainEqual({ admin: false, user_id: user1.id });
            }
          }
        });

        it('共同利用者による検索', async () => {
          expect.assertions(13);
          const res = await service.find(
            { user: user1, test: params.test, query: { $joinEager: 'members' } },
          );
          if (res instanceof Array) {
            expect(res.length).toBe(1);
            const stream1 = res[0];
            expect(stream1.id).toBe(stream.id);
            expect(stream1.name).toBe(name);
            expect(stream1.comment).toBe(comment);
            expect(stream1.configFile).toBe(configFile);
            expect(stream1.createdAt).not.toBeNull();
            expect(stream1.updatedAt).toEqual(stream.createdAt);
            expect(stream1.createdUser).toBe(user.id);
            expect(stream1.updatedUser).toBe(user.id);
            expect(stream1.admin).toBe(false);
            if (stream1.members instanceof Array) {
              expect(stream1.members.length).toBe(2);
              expect(stream1.members).toContainEqual({ admin: true, user_id: user.id });
              expect(stream1.members).toContainEqual({ admin: false, user_id: user1.id });
            }
          }
        });
      });

      it('members.userの指定', async () => {
        expect.assertions(13);
        const res = await service.find(
          { ...params, query: { $joinEager: 'members.user' } },
        );
        if (res instanceof Array) {
          expect(res.length).toBe(1);
          const stream1 = res[0];
          expect(stream1.id).toBe(stream.id);
          expect(stream1.name).toBe(name);
          expect(stream1.comment).toBe(comment);
          expect(stream1.configFile).toBe(configFile);
          expect(stream1.createdAt).not.toBeNull();
          expect(stream1.updatedAt).toEqual(stream.createdAt);
          expect(stream1.createdUser).toBe(user.id);
          expect(stream1.updatedUser).toBe(user.id);
          expect(stream1.admin).toBe(true);
          if (stream1.members instanceof Array) {
            expect(stream1.members.length).toBe(2);
            const userAttrSelect = (u: {[key: string]: any}): {[key: string]: any} => {
              const { displayName, email, name: userName } = u;
              return { displayName, email, name: userName };
            };
            expect(stream1.members)
              .toContainEqual({ admin: true, user_id: user.id, user: userAttrSelect(user) });
            expect(stream1.members)
              .toContainEqual({ admin: false, user_id: user1.id, user: userAttrSelect(user1) });
          }
        }
      });

      it('topicsの指定', async () => {
        expect.assertions(11);
        const res = await service.find(
          { ...params, query: { $joinEager: 'topics' } },
        );
        if (res instanceof Array) {
          expect(res.length).toBe(1);
          const stream1 = res[0];
          expect(stream1.id).toBe(stream.id);
          expect(stream1.name).toBe(name);
          expect(stream1.comment).toBe(comment);
          expect(stream1.configFile).toBe(configFile);
          expect(stream1.createdAt).not.toBeNull();
          expect(stream1.updatedAt).toEqual(stream.createdAt);
          expect(stream1.createdUser).toBe(user.id);
          expect(stream1.updatedUser).toBe(user.id);
          if (stream1.topics instanceof Array) {
            expect(stream1.topics.length).toBe(1);
            expect(stream1.topics[0].name).toBe('topic-kafka-001');
          }
        }
      });
    });

    beforeEach(async () => {
      stream = await service.create({ name, comment, configFile }, { ...params });
      await db('members').insert({ user_id: user1.id, stream_id: stream.id });
    });
  });

  beforeEach(async () => {
    await db('streams').del();
    const test = { jest: true };
    params = { user, test };
  });

  const userInfo = {
    name: 'admin@example.com',
  };
  const user1Info = {
    name: 'someone@example.com',
  };
  const otherUserInfo = {
    name: 'other@example.com',
  };

  beforeAll(async () => {
    db = app.get('knex');
    await db('members').del();
    await db('streams').del();
    await db('users').del();
    await db('users').insert(userInfo);
    await db('users').insert(user1Info);
    await db('users').insert(otherUserInfo);
    [user] = ((await app.service('users').find({ query: { name: userInfo.name } })) as Users[]);
    [user1] = ((await app.service('users').find({ query: { name: user1Info.name } })) as Users[]);
    [otherUser] = ((await app.service('users').find({ query: { name: otherUserInfo.name } })) as Users[]);
  });

  afterAll(async () => {
    await db('members').del();
    await db('streams').del();
    await db('users').del();
  });
});
