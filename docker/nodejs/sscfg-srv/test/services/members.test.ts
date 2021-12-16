/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import {
  BadRequest, Conflict, Forbidden, MethodNotAllowed, NotFound,
} from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import knex from 'knex';
import app from '../../src/app';
import { Members } from '../../src/models/members.model';
import { Streams } from '../../src/models/streams.model';
import { Users } from '../../src/models/users.model';

describe('\'members\' service', () => {
  let db: knex;
  const service = app.service('members');
  let user: Users;
  let user1: Users;
  let user2: Users;
  let otherUser: Users;
  let stream: Streams;
  let params: Params;

  describe('共同利用者を登録する', () => {
    describe('登録の実行', () => {
      it('共同利用者の登録', async () => {
        expect.assertions(8);
        const member = await service.create({
          user_id: user1.id,
          stream_id: stream.id,
        }, params);
        expect(member.id).not.toBeNull();
        expect(member.admin).toBe(false);
        expect(member.stream_id).toBe(stream.id);
        expect(member.user_id).toBe(user1.id);
        expect(member.createdAt).not.toBeNull();
        expect(member.updatedAt).not.toBeNull();
        expect(member.createdUser).toBe(user.id);
        expect(member.updatedUser).toBe(user.id);
      });

      it('データ管理者の登録', async () => {
        expect.assertions(8);
        const member = await service.create({
          user_id: user1.id,
          stream_id: stream.id,
          admin: true,
        }, params);
        expect(member.id).not.toBeNull();
        expect(member.admin).toBe(true);
        expect(member.stream_id).toBe(stream.id);
        expect(member.user_id).toBe(user1.id);
        expect(member.createdAt).not.toBeNull();
        expect(member.updatedAt).not.toBeNull();
        expect(member.createdUser).toBe(user.id);
        expect(member.updatedUser).toBe(user.id);
      });

      describe('異常系', () => {
        describe('権限のない利用者による登録', () => {
          it('共同利用者でない利用者', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create(
                {
                  user_id: user2.id,
                  stream_id: stream.id,
                },
                { user: otherUser, test: params.test },
              );
            }).rejects.toThrowError(Forbidden);
          });

          it('データ管理者でない利用者', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create(
                {
                  user_id: user2.id,
                  stream_id: stream.id,
                },
                { user: user1, test: params.test },
              );
            }).rejects.toThrowError(Forbidden);
          });
        });

        it('重複するレコードを登録する', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create(
              {
                user_id: user1.id,
                stream_id: stream.id,
              },
              params,
            );
          }).rejects.toThrowError(Conflict);
        });

        describe('必須項目の指定が不足している', () => {
          it('stream_id', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create({ user_id: user2.id }, params);
            }).rejects.toThrowError(BadRequest);
          });

          it('user_id', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create({ stream_id: stream.id }, params);
            }).rejects.toThrowError(BadRequest);
          });
        });

        describe('外部参照の値が正しくない', () => {
          it('stream_id', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create({
                user_id: user2.id,
                stream_id: -1,
              }, params);
            }).rejects.toThrowError(Forbidden);
          });

          it('user_id', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create({
                user_id: -1,
                stream_id: stream.id,
              }, params);
            }).rejects.toThrowError(Conflict);
          });
        });

        beforeEach(async () => {
          await db('members').insert({ user_id: user1.id, stream_id: stream.id });
        });
      });
    });
  });

  describe('共同利用者を変更する', () => {
    let adminMember: Members;
    let member: Members;

    describe('管理者権限を変更する', () => {
      it('管理者権限を付与する', async () => {
        expect.assertions(3);
        const member1 = await service.patch(member.id, { admin: true }, params);
        const { admin: _admin, updatedAt: updatedAt0, ...memberParams0 } = member;
        const { admin, updatedAt: updatedAt1, ...memberParams1 } = member1;
        expect(admin).toBe(true);
        expect(updatedAt1).not.toEqual(updatedAt0);
        expect(memberParams1).toEqual(memberParams0);
      });

      it('管理者権限を除去する', async () => {
        expect.assertions(3);
        const member1 = await service.patch(adminMember.id, { admin: false }, params);
        const { admin: _admin, updatedAt: updatedAt0, ...memberParams0 } = adminMember;
        const { admin, updatedAt: updatedAt1, ...memberParams1 } = member1;
        expect(admin).toBe(false);
        expect(updatedAt1).not.toEqual(updatedAt0);
        expect(memberParams1).toEqual(memberParams0);
      });
    });

    describe('異常系', () => {
      let otherStream: Streams;

      describe('変更不可の項目', () => {
        it('user_id', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(member.id, { user_id: otherUser.id }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('stream_id', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(member.id, { stream_id: otherStream.id }, params);
          }).rejects.toThrowError(BadRequest);
        });

        beforeEach(async () => {
          const name = 'config-002';
          otherStream = await app.service('streams').create({ name }, { ...params });
        });
      });

      describe('権限のない利用者による変更', () => {
        it('共同利用者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(
              member.id,
              { admin: true },
              { user: otherUser, test: params.test },
            );
          }).rejects.toThrowError(Forbidden);
        });

        it('データ管理者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(
              adminMember.id,
              { admin: false },
              { user: user1, test: params.test },
            );
          }).rejects.toThrowError(Forbidden);
        });
      });

      it('自分自身のレコードは変更できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.patch(
            adminMember.id,
            { admin: false },
            { user: user2, test: params.test },
          );
        }).rejects.toThrowError(BadRequest);
      });

      it('PUTで変更することはできない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.update(
            member.id,
            {
              user_id: user1.id,
              stream_id: stream.id,
              admin: true,
            },
            params,
          );
        }).rejects.toThrowError(MethodNotAllowed);
      });
    });

    beforeEach(async () => {
      member = await service.create({
        user_id: user1.id,
        stream_id: stream.id,
      }, { ...params });
      adminMember = await service.create({
        user_id: user2.id,
        stream_id: stream.id,
        admin: true,
      }, { ...params });
    });
  });

  describe('共同利用者を削除する', () => {
    let adminMember: Members;
    let member: Members;

    it('削除の実行', async () => {
      expect.assertions(2);
      const ret = await service.remove(member.id, { ...params });
      expect(ret).toBeTruthy();
      const res = await service.find({
        ...params, query: { $limit: 0, stream_id: stream.id },
      });
      if (!(res instanceof Array)) {
        expect(res.total).toBe(2);
      }
    });

    describe('権限のない利用者による削除', () => {
      it('共同利用者でない利用者', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.remove(
            member.id,
            { user: otherUser, test: params.test },
          );
        }).rejects.toThrowError(Forbidden);
      });

      it('データ管理者でない利用者', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.remove(
            adminMember.id,
            { user: user1, test: params.test },
          );
        }).rejects.toThrowError(Forbidden);
      });
    });

    it('自分自身のレコードは削除できない', async () => {
      expect.assertions(1);
      await expect(async () => {
        await service.remove(
          adminMember.id,
          { user: user2, test: params.test },
        );
      }).rejects.toThrowError(BadRequest);
    });

    beforeEach(async () => {
      member = await service.create({
        user_id: user1.id,
        stream_id: stream.id,
      }, { ...params });
      adminMember = await service.create({
        user_id: user2.id,
        stream_id: stream.id,
        admin: true,
      }, { ...params });
    });
  });

  describe('共同利用者を取得する', () => {
    let member: Members;

    it('データ管理者による取得', async () => {
      expect.assertions(1);
      const member1 = await service.get(member.id, params);
      expect(member1).toEqual(member);
    });

    it('共同利用者は取得できない', async () => {
      expect.assertions(1);
      await expect(async () => {
        await service.get(member.id, { user: user1, test: params.test });
      }).rejects.toThrowError(NotFound);
    });

    it('共同利用者でない利用者による操作', async () => {
      expect.assertions(1);
      await expect(async () => {
        await service.get(member.id, { user: otherUser, test: params.test });
      }).rejects.toThrowError(NotFound);
    });

    beforeEach(async () => {
      member = await service.create({
        user_id: user1.id,
        stream_id: stream.id,
      }, { ...params });
    });
  });

  describe('共同利用者の検索', () => {
    let member: Members;
    let adminMember: Members;

    it('データ管理者による取得', async () => {
      expect.assertions(3);
      const res = await service.find(params);
      if (res instanceof Array) {
        expect(res.length).toBe(3);
        expect(res).toContainEqual(member);
        expect(res).toContainEqual(adminMember);
      }
    });

    it('共同利用者は取得できない', async () => {
      expect.assertions(1);
      const res = await service.find({ user: user1, test: params.test });
      if (res instanceof Array) {
        expect(res.length).toBe(0);
      }
    });

    it('共同利用者でない利用者による操作', async () => {
      expect.assertions(1);
      const res = await service.find({ user: otherUser, test: params.test });
      if (res instanceof Array) {
        expect(res.length).toBe(0);
      }
    });

    beforeEach(async () => {
      member = await service.create({
        user_id: user1.id,
        stream_id: stream.id,
      }, { ...params });
      adminMember = await service.create({
        user_id: user2.id,
        stream_id: stream.id,
        admin: true,
      }, { ...params });
    });
  });

  describe('コンフィグ情報との関連', () => {
    const streams = app.service('streams');

    it('取得したコンフィグ情報に関連する共同利用者', async () => {
      expect.assertions(3);
      const stream1 = await streams.get(stream.id, { ...params, query: { $joinEager: 'members' } });
      if (stream1.members instanceof Array) {
        expect(stream1.members.length).toBe(2);
        expect(stream1.members).toContainEqual({ admin: true, user_id: user.id });
        expect(stream1.members).toContainEqual({ admin: false, user_id: user1.id });
      }
    });

    it('検索したコンフィグ情報に関連する共同利用者', async () => {
      expect.assertions(4);
      const res = await streams.find({ ...params, query: { $joinEager: 'members' } });
      if (res instanceof Array) {
        expect(res.length).toBe(1);
        const stream1 = res[0];
        if (stream1.members instanceof Array) {
          expect(stream1.members.length).toBe(2);
          expect(stream1.members).toContainEqual({ admin: true, user_id: user.id });
          expect(stream1.members).toContainEqual({ admin: false, user_id: user1.id });
        }
      }
    });

    it('コンフィグ情報を削除により関連する共同利用者が削除されること', async () => {
      expect.assertions(2);
      const res0 = await service.find({ query: { $limit: 0 }, ...params });
      if (!(res0 instanceof Array)) {
        expect(res0.total).toBe(2);
      }
      await streams.remove(stream.id, { ...params });
      const res1 = await service.find({ query: { $limit: 0 }, ...params });
      if (!(res1 instanceof Array)) {
        expect(res1.total).toBe(0);
      }
    });

    beforeEach(async () => {
      await service.create({ user_id: user1.id, stream_id: stream.id }, { ...params });
    });
  });

  beforeEach(async () => {
    await db('members').del();
    await db('streams').del();
    const test = { jest: true };
    params = { user, test };
    const name = 'config-001';
    stream = await app.service('streams').create({ name }, { ...params });
  });

  const userInfo = {
    name: 'admin@example.com',
  };
  const user1Info = {
    name: 'someone@example.com',
  };
  const user2Info = {
    name: 'admin2@example.com',
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
    await db('users').insert(user2Info);
    await db('users').insert(otherUserInfo);
    [user] = ((await app.service('users').find({ query: { name: userInfo.name } })) as Users[]);
    [user1] = ((await app.service('users').find({ query: { name: user1Info.name } })) as Users[]);
    [user2] = ((await app.service('users').find({ query: { name: user2Info.name } })) as Users[]);
    [otherUser] = ((await app.service('users').find({ query: { name: otherUserInfo.name } })) as Users[]);
  });

  afterAll(async () => {
    await db('members').del();
    await db('streams').del();
    await db('users').del();
  });
});
