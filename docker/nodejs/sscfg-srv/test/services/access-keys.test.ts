import { BadRequest, MethodNotAllowed, NotFound } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { Knex } from 'knex';
import app from '../../src/app';
import { getAppRoleName } from '../../src/hooks/process-access-keys';
import { Streams } from '../../src/models/streams.model';
import { Users } from '../../src/models/users.model';
import { AccessKeys } from '../../src/services/access-keys/access-keys.class';

describe('\'access-keys\' service', () => {
  let db: Knex;
  const service = app.service('access-keys');
  const comment = 'comment access key';
  let user: Users;
  let otherUser: Users;
  let params: Params;
  let paramsOtherUser: Params;
  let stream: Streams;
  let otherStream: Streams;
  let authentication: Record<string, any>;
  let authentication2: Record<string, any>;

  describe('APIアクセスキーの登録', () => {
    it('全てのコンフィグ情報を対象とするアクセスキー', async () => {
      expect.assertions(9);
      const accessKey = await service.create({
        allPermitted: true,
        comment,
      }, { ...params });
      expect(accessKey.allPermitted).toBe(true);
      expect(accessKey.comment).toBe(comment);
      expect(accessKey.createdAt).not.toBeNull();
      expect(accessKey.expirationTime).not.toBeNull();
      expect(accessKey.roleId).not.toBeNull();
      expect(accessKey.secretId).not.toBeNull();
      expect(accessKey.user_id).toBe(user.id);

      const appRoleName = getAppRoleName(accessKey.id);
      const vault = app.service('sys-vault');
      // AppRoleが登録されていること
      const appRole = await vault.get(`auth/approle/role/${appRoleName}`, { ...params });
      expect(appRole).toBeTruthy();
      // policyが登録されていること
      const policy = await vault.get(`sys/policy/${appRoleName}`, { ...params });
      expect(policy).toBeTruthy();
    });

    it('特定のコンフィグ情報を対象とするアクセスキー', async () => {
      expect.assertions(12);
      const accessKey = await service.create({
        allPermitted: false,
        streams: [{ id: stream.id }],
        comment,
      }, { ...params });
      expect(accessKey.allPermitted).toBe(false);
      expect(accessKey.comment).toBe(comment);
      expect(accessKey.createdAt).not.toBeNull();
      expect(accessKey.expirationTime).not.toBeNull();
      expect(accessKey.roleId).not.toBeNull();
      expect(accessKey.secretId).not.toBeNull();
      expect(accessKey.user_id).toBe(user.id);

      const accessKey1 = await service.get(accessKey.id, {
        query: { $joinEager: 'streams' },
        ...params,
      });
      if (accessKey1.streams instanceof Array) {
        expect(accessKey1.streams.length).toBe(1);
        expect(accessKey1.streams[0].id).toBe(stream.id);
        expect(accessKey1.streams[0].name).toBe(stream.name);
      }

      const appRoleName = getAppRoleName(accessKey.id);
      const vault = app.service('sys-vault');
      // AppRoleが登録されていること
      const appRole = await vault.get(`auth/approle/role/${appRoleName}`, { ...params });
      expect(appRole).toBeTruthy();
      // policyが登録されていること
      const policy = await vault.get(`sys/policy/${appRoleName}`, { ...params });
      expect(policy).toBeTruthy();
    });

    describe('異常系', () => {
      it('存在しないstream idが指定された', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.create({
            allPermitted: false,
            streams: [{ id: -1 }],
            comment,
          }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('メンバーでないstreamが指定された', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.create({
            allPermitted: false,
            streams: [{ id: otherStream.id }],
            comment,
          }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('allPermittedかつstreamsの指定がある場合', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.create({
            allPermitted: true,
            streams: [{ id: stream.id }],
            comment,
          }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('allPermitted=falseかつstreamsの指定がない場合', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.create({
            allPermitted: false,
            comment,
          }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('他ユーザのアクセスキーは登録できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.create({
            allPermitted: true,
            comment,
            user_id: otherUser.id,
          }, params);
        }).rejects.toThrowError(BadRequest);
      });
    });
  });

  describe('APIアクセスキーの削除', () => {
    it('全てのコンフィグ情報を対象とするアクセスキー', async () => {
      expect.assertions(4);
      const accessKey0 = await service.create({
        allPermitted: true,
        comment,
      }, { ...params });
      expect(accessKey0).toBeTruthy();

      const accessKey1 = await service.remove(accessKey0.id, { ...params });
      expect(accessKey1).toBeTruthy();

      const appRole = getAppRoleName(accessKey0.id);
      const vault = app.service('sys-vault');
      // AppRoleが削除されていること
      await expect(async () => {
        await vault.get(`auth/approle/role/${appRole}`, { ...params });
      }).rejects.toThrowError(NotFound);
      // policyが削除されていること
      await expect(async () => {
        await vault.get(`sys/policy/${appRole}`, { ...params });
      }).rejects.toThrowError(NotFound);
    });

    it('特定のコンフィグ情報を対象とするアクセスキー', async () => {
      expect.assertions(4);
      const accessKey0 = await service.create({
        allPermitted: false,
        streams: [{ id: stream.id }],
        comment,
      }, { ...params });
      expect(accessKey0).toBeTruthy();

      const accessKey1 = await service.remove(accessKey0.id, { ...params });
      expect(accessKey1).toBeTruthy();

      const appRole = getAppRoleName(accessKey0.id);
      const vault = app.service('sys-vault');
      // AppRoleが削除されていること
      await expect(async () => {
        await vault.get(`auth/approle/role/${appRole}`, { ...params });
      }).rejects.toThrowError(NotFound);
      // policyが削除されていること
      await expect(async () => {
        await vault.get(`sys/policy/${appRole}`, { ...params });
      }).rejects.toThrowError(NotFound);
    });

    describe('異常系', () => {
      it('他ユーザのアクセスキーは削除できない', async () => {
        expect.assertions(4);
        const accessKey0 = await service.create({
          allPermitted: true,
          comment,
        }, { ...paramsOtherUser });
        expect(accessKey0).toBeTruthy();

        await expect(async () => {
          await service.remove(accessKey0.id, { ...params });
        }).rejects.toThrowError(NotFound);

        const appRoleName = getAppRoleName(accessKey0.id);
        const vault = app.service('sys-vault');
        // AppRoleが登録されたままであること
        const appRole = await vault.get(`auth/approle/role/${appRoleName}`, { ...paramsOtherUser });
        expect(appRole).toBeTruthy();
        // policyが登録されたままであること
        const policy = await vault.get(`sys/policy/${appRoleName}`, { ...paramsOtherUser });
        expect(policy).toBeTruthy();
      });
    });
  });

  describe('APIアクセスキーの取得', () => {
    let accessKey1: AccessKeys;
    let accessKey2: AccessKeys;

    describe('取得項目の確認', () => {
      it('全てのコンフィグ情報を対象とするアクセスキー', async () => {
        expect.assertions(8);
        const query = { $joinEager: 'streams' };
        const accessKey = await service.get(accessKey1.id, { query, ...params });
        expect(accessKey.allPermitted).toBe(true);
        expect(accessKey.comment).toBe(comment);
        expect(accessKey.createdAt).not.toBeNull();
        expect(accessKey.expirationTime).not.toBeNull();
        expect(accessKey.roleId).not.toBeNull();
        expect(accessKey.secretId).not.toBeNull();
        expect(accessKey.user_id).toBe(user.id);
        if (accessKey.streams instanceof Array) {
          expect(accessKey.streams.length).toBe(0);
        }
      });

      it('特定のコンフィグ情報を対象とするアクセスキー', async () => {
        expect.assertions(10);
        const query = { $joinEager: 'streams' };
        const accessKey = await service.get(accessKey2.id, { query, ...params });
        expect(accessKey.allPermitted).toBe(false);
        expect(accessKey.comment).toBe(comment);
        expect(accessKey.createdAt).not.toBeNull();
        expect(accessKey.expirationTime).not.toBeNull();
        expect(accessKey.roleId).not.toBeNull();
        expect(accessKey.secretId).not.toBeNull();
        expect(accessKey.user_id).toBe(user.id);
        if (accessKey.streams instanceof Array) {
          expect(accessKey.streams.length).toBe(1);
          expect(accessKey.streams[0].id).toBe(stream.id);
          expect(accessKey.streams[0].name).toBe(stream.name);
        }
      });
    });

    describe('検索', () => {
      it('全てのアクセスキーを取得する', async () => {
        expect.assertions(3);
        const res = await service.find({ ...params });
        if (res instanceof Array) {
          expect(res.length).toBe(2);
          expect(res).toContainEqual(accessKey1);
          expect(res).toContainEqual(accessKey2);
        }
      });

      it('検索条件を指定する', async () => {
        expect.assertions(2);
        const query = { allPermitted: true };
        const res = await service.find({ query, ...params });
        if (res instanceof Array) {
          expect(res.length).toBe(1);
          expect(res).toContainEqual(accessKey1);
        }
      });
    });

    describe('異常系', () => {
      it('他ユーザのアクセスキーは取得できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(accessKey1.id, paramsOtherUser);
        }).rejects.toThrowError(NotFound);
      });

      it('他ユーザのアクセスキーは検索結果に含まれない', async () => {
        expect.assertions(1);
        const res = await service.find(paramsOtherUser);
        if (res instanceof Array) {
          expect(res.length).toBe(0);
        }
      });
    });

    describe('有効期限', () => {
      it('有効期限が切れたものは検索結果に含まれない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(accessKey1.id, params);
        }).rejects.toThrowError(NotFound);
      });

      it('有効期限が切れたものは検索結果に含まれない', async () => {
        expect.assertions(2);
        const res = await service.find(params);
        if (res instanceof Array) {
          expect(res.length).toBe(1);
          expect(res).toContainEqual(accessKey2);
        }
      });

      beforeEach(async () => {
        await db('api_access_key_expirations')
          .where('api_access_key_id', accessKey1.id)
          .update('expirationTime', new Date().toISOString());
      });
    });

    beforeEach(async () => {
      accessKey1 = await service.create({
        allPermitted: true,
        comment,
      }, { ...params });
      accessKey2 = await service.create({
        allPermitted: false,
        streams: [{ id: stream.id }],
        comment,
      }, { ...params });
    });
  });

  describe('APIアクセスキーの更新', () => {
    let accessKey: AccessKeys;

    it('PUTで更新できないこと', async () => {
      expect.assertions(1);
      const newComment = `new-${comment}`;
      await expect(async () => {
        await service.update(accessKey.id, { comment: newComment }, params);
      }).rejects.toThrowError(MethodNotAllowed);
    });

    it('PATCHで更新できないこと', async () => {
      expect.assertions(1);
      const newComment = `new-${comment}`;
      await expect(async () => {
        await service.patch(accessKey.id, { comment: newComment }, params);
      }).rejects.toThrowError(MethodNotAllowed);
    });

    beforeEach(async () => {
      accessKey = await service.create({
        allPermitted: true,
        comment,
      }, { ...params });
    });
  });

  const adminInfo = {
    name: 'admin',
    systemAdmin: true,
  };

  const userInfo = {
    name: 'someone',
    password: 'pass01',
  };

  const userInfo2 = {
    name: 'someone2',
    password: 'pass02',
  };

  beforeEach(async () => {
    await db('api_access_keys').del();
    const test = { jest: true };
    params = { user, authentication, test };
    paramsOtherUser = { user: otherUser, authentication: authentication2, test };
  });

  const getAuthentication = async (uinfo: Record<string, string>): Promise<Record<string, any>> => {
    const res = await app.service('authentication').create({ ...uinfo, strategy: 'local' }, {});
    const { payload, accessToken } = res.authentication;
    return { strategy: 'jwt', accessToken, payload };
  };

  beforeAll(async () => {
    db = app.get('knex');
    await db('streams').del();
    await db('api_access_keys').del();
    await db('users').del();

    await db('users').insert(adminInfo);
    const userService = app.service('users');
    const [admin] = ((await userService.find({ query: { name: adminInfo.name } })) as Users[]);
    user = await userService.create(userInfo, { user: admin });
    otherUser = await userService.create(userInfo2, { user: admin });
    authentication = await getAuthentication(userInfo);
    authentication2 = await getAuthentication(userInfo2);

    const streamService = app.service('streams');
    stream = await streamService.create({ name: 'stream0' }, { user, test: { jest: true } });
    otherStream = await streamService.create({ name: 'stream1' }, { user: otherUser, test: { jest: true } });
  });

  afterAll(async () => {
    await db('streams').del();
    await db('api_access_keys').del();
    await db('users').del();
  });
});
