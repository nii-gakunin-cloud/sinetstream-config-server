import { BadRequest, Forbidden, NotFound } from '@feathersjs/errors';
import { generateKeyPairSync, randomBytes } from 'crypto';
import knex from 'knex';
import sshpk from 'sshpk';
import app from '../../src/app';
import { toVid as toAfileVid } from '../../src/hooks/process-attach-files';
import { toVid as toEkeyVid } from '../../src/hooks/process-encrypt-keys';
import { toVid as toUprmVid } from '../../src/hooks/process-user-parameters';
import { Users } from '../../src/models/users.model';

describe('\'api-v1-secrets\' service', () => {
  let db: knex;
  const service = app.service('api/v1/secrets');
  let user: Users;
  let user1: Users;
  const test = { jest: true };
  const stream0 = 'config-000';
  const stream1 = 'config-001';
  const stream2 = 'config-002';
  let fingerprint1: string;
  let fingerprint2: string;
  let secretId0: string;
  let secretId: string;
  const targetEkey = '*.crypto.key';
  const targetAfile = '*.tls.ca_certs';
  const targetUprm = '*.sasl_plain_password';
  let vid1: string;
  let vid2: string;
  let vid3: string;
  let vid4: string;
  let vid5: string;
  let vid11: string;
  let vid12: string;
  let vid13: string;
  const HTTP_HEADER_FINGERPRINT = 'sinetstream-config-publickey';
  const encryptKey = randomBytes(32).toString('base64');
  const content = randomBytes(32).toString('base64');
  const textContent = 'abcdefgh';
  let authentication: Record<string, any>;

  describe('秘匿情報が取得できること', () => {
    describe('データ暗号鍵', () => {
      describe('デフォルトの公開鍵', () => {
        it('最新バージョン', async () => {
          expect.assertions(4);
          const params = { authentication, test };
          const res = await service.get(vid2, params);
          expect(res.id).toBe(vid2);
          expect(res.target).toBe(targetEkey);
          expect(res.fingerprint).toBe(fingerprint1);
          expect(res.value).not.toBeNull();
        });

        it('古いデータ暗号鍵', async () => {
          expect.assertions(4);
          const params = { authentication, test };
          const res = await service.get(vid1, params);
          expect(res.id).toBe(vid1);
          expect(res.target).toBe(targetEkey);
          expect(res.fingerprint).toBe(fingerprint1);
          expect(res.value).not.toBeNull();
        });
      });

      describe('公開鍵の明示的な指定', () => {
        it('最新バージョン', async () => {
          expect.assertions(4);
          const params = {
            headers: { [HTTP_HEADER_FINGERPRINT]: fingerprint2 },
            authentication,
            test,
          };
          const res = await service.get(vid2, params);
          expect(res.id).toBe(vid2);
          expect(res.target).toBe(targetEkey);
          expect(res.fingerprint).toBe(fingerprint2);
          expect(res.value).not.toBeNull();
        });

        it('古いデータ暗号鍵', async () => {
          expect.assertions(4);
          const params = {
            headers: { [HTTP_HEADER_FINGERPRINT]: fingerprint2 },
            authentication,
            test,
          };
          const res = await service.get(vid1, params);
          expect(res.id).toBe(vid1);
          expect(res.target).toBe(targetEkey);
          expect(res.fingerprint).toBe(fingerprint2);
          expect(res.value).not.toBeNull();
        });
      });
    });

    describe('添付ファイル', () => {
      it('デフォルトの公開鍵', async () => {
        expect.assertions(4);
        const params = { authentication, test };
        const res = await service.get(vid3, params);
        expect(res.id).toBe(vid3);
        expect(res.target).toBe(targetAfile);
        expect(res.fingerprint).toBe(fingerprint1);
        expect(res.value).not.toBeNull();
      });

      it('公開鍵の明示的な指定', async () => {
        expect.assertions(4);
        const params = {
          headers: { [HTTP_HEADER_FINGERPRINT]: fingerprint2 },
          authentication,
          test,
        };
        const res = await service.get(vid3, params);
        expect(res.id).toBe(vid3);
        expect(res.target).toBe(targetAfile);
        expect(res.fingerprint).toBe(fingerprint2);
        expect(res.value).not.toBeNull();
      });
    });

    describe('ユーザパラメータ', () => {
      describe('デフォルトの公開鍵', () => {
        it('バイナリパラメータ', async () => {
          expect.assertions(4);
          const params = { authentication, test };
          const res = await service.get(vid4, params);
          expect(res.id).toBe(vid4);
          expect(res.target).toBe(targetUprm);
          expect(res.fingerprint).toBe(fingerprint1);
          expect(res.value).not.toBeNull();
        });

        it('テキストパラメータ', async () => {
          expect.assertions(4);
          const params = { authentication, test };
          const res = await service.get(vid5, params);
          expect(res.id).toBe(vid5);
          expect(res.target).toBe(targetUprm);
          expect(res.fingerprint).toBe(fingerprint1);
          expect(res.value).not.toBeNull();
        });
      });

      describe('公開鍵の明示的な指定', () => {
        it('バイナリパラメータ', async () => {
          expect.assertions(4);
          const params = {
            headers: { [HTTP_HEADER_FINGERPRINT]: fingerprint2 },
            authentication,
            test,
          };
          const res = await service.get(vid4, params);
          expect(res.id).toBe(vid4);
          expect(res.target).toBe(targetUprm);
          expect(res.fingerprint).toBe(fingerprint2);
          expect(res.value).not.toBeNull();
        });

        it('テキストパラメータ', async () => {
          expect.assertions(4);
          const params = {
            headers: { [HTTP_HEADER_FINGERPRINT]: fingerprint2 },
            authentication,
            test,
          };
          const res = await service.get(vid5, params);
          expect(res.id).toBe(vid5);
          expect(res.target).toBe(targetUprm);
          expect(res.fingerprint).toBe(fingerprint2);
          expect(res.value).not.toBeNull();
        });
      });
    });
  });

  describe('異常系', () => {
    it.each(['xxx', 'encrypt-keys-0', 'streams-1', 'streams-xxx-1'])('存在しないID: %s', async (id) => {
      expect.assertions(1);
      const params = { authentication, test };
      await expect(async () => {
        await service.get(id, params);
      }).rejects.toThrowError(NotFound);
    });

    it('指定した公開鍵が存在しない', async () => {
      expect.assertions(1);
      const params = {
        headers: { [HTTP_HEADER_FINGERPRINT]: `${fingerprint2}xxx` },
        authentication,
        test,
      };
      await expect(async () => {
        await service.get(vid1, params);
      }).rejects.toThrowError(BadRequest);
    });

    describe('公開鍵が登録されていない', () => {
      it('APIの実行', async () => {
        expect.assertions(1);
        const params = { authentication, test };
        await expect(async () => {
          await service.get(vid1, params);
        }).rejects.toThrowError(BadRequest);
      });

      beforeEach(async () => {
        const res = await app.service('authentication').create({
          user: user.name,
          'secret-key': secretId0,
          strategy: 'api-access',
        }, {});
        const { payload, accessToken } = res.authentication;
        authentication = { strategy: 'jwt', accessToken, payload };
      });
    });

    it('共同利用者でない', async () => {
      expect.assertions(1);
      const params = { authentication, test };
      await expect(async () => {
        await service.get(vid11, params);
      }).rejects.toThrowError(Forbidden);
    });

    it('アクセスキーの許可対象外', async () => {
      expect.assertions(1);
      const params = { authentication, test };
      await expect(async () => {
        await service.get(vid12, params);
      }).rejects.toThrowError(Forbidden);
    });

    it('他ユーザのユーザパラメータ', async () => {
      expect.assertions(1);
      const params = { authentication, test };
      await expect(async () => {
        await service.get(vid13, params);
      }).rejects.toThrowError(Forbidden);
    });
  });

  beforeEach(async () => {
    const res = await app.service('authentication').create({
      user: user1.name,
      'secret-key': secretId,
      strategy: 'api-access',
    }, {});
    const { payload, accessToken } = res.authentication;
    authentication = { strategy: 'jwt', accessToken, payload };
  });

  const adminInfo = {
    name: 'admin',
    systemAdmin: true,
  };
  const userInfo = {
    name: 'user00',
    password: 'pass00',
    displayName: 'admin user',
  };
  const user1Info = {
    name: 'user01',
    password: 'pass01',
  };

  const getAuthentication = async (uinfo: Record<string, string>): Promise<Record<string, any>> => {
    const res = await app.service('authentication').create(
      { ...uinfo, strategy: 'local' }, {},
    );
    const { payload, accessToken } = res.authentication;
    return { strategy: 'jwt', accessToken, payload };
  };

  beforeAll(async () => {
    db = app.get('knex');
    await db('streams').del();
    await db('api_access_keys').del();
    await db('public_keys').del();
    await db('users').del();

    await db('users').insert(adminInfo);
    const userService = app.service('users');
    const [admin] = ((await userService.find({ query: { name: adminInfo.name } })) as Users[]);
    user = await userService.create(userInfo, { user: admin });
    user1 = await userService.create(user1Info, { user: admin });
    const authentication0 = await getAuthentication(userInfo);
    const authentication1 = await getAuthentication(user1Info);
    const params = { user, authentication: authentication0, test };
    const paramsUser1 = { user, authentication: authentication1, test };

    const ekeyService = app.service('encrypt-keys');
    const afileService = app.service('attach-files');
    const uprmService = app.service('user-parameters');

    const s1 = await app.service('streams').create({ name: stream1 }, { user, test });
    await db('members').insert({ user_id: user1.id, stream_id: s1.id });
    const ekey1 = await ekeyService.create(
      {
        size: 256, key: content, target: targetEkey, stream_id: s1.id, enabled: true,
      },
      { ...params },
    );
    vid1 = toEkeyVid(ekey1).split('.').slice(-2).join('-');
    const ekey2 = await ekeyService.create(
      {
        size: 256, key: encryptKey, target: targetEkey, stream_id: s1.id, enabled: true,
      },
      { ...params },
    );
    vid2 = toEkeyVid(ekey2).split('.').slice(-2).join('-');
    const afile = await afileService.create({
      content,
      target: targetAfile,
      stream_id: s1.id,
      enabled: true,
      secret: true,
    }, { ...params });
    vid3 = toAfileVid(afile).split('.').slice(-2).join('-');
    const uprm1 = await uprmService.create({
      content,
      target: targetUprm,
      stream_id: s1.id,
      user_id: user1.id,
      enabled: true,
      secret: true,
    }, { ...params });
    vid4 = toUprmVid(uprm1).split('.').slice(-3).join('-');
    const uprm2 = await uprmService.create({
      textContent,
      target: targetUprm,
      stream_id: s1.id,
      user_id: user1.id,
      enabled: true,
      secret: true,
    }, { ...params });
    vid5 = toUprmVid(uprm2).split('.').slice(-3).join('-');

    const s0 = await app.service('streams').create({ name: stream0 }, { user, test });
    const ekey11 = await ekeyService.create(
      {
        size: 256, key: content, target: targetEkey, stream_id: s0.id, enabled: true,
      },
      { ...params },
    );
    vid11 = toEkeyVid(ekey11).split('.').slice(-2).join('-');

    const s2 = await app.service('streams').create({ name: stream2 }, { user, test });
    await db('members').insert({ user_id: user1.id, stream_id: s2.id });
    const ekey12 = await ekeyService.create(
      {
        size: 256, key: content, target: targetEkey, stream_id: s2.id, enabled: true,
      },
      { ...params },
    );
    vid12 = toEkeyVid(ekey12).split('.').slice(-2).join('-');
    const uprm3 = await uprmService.create({
      content,
      target: targetUprm,
      stream_id: s1.id,
      user_id: user.id,
      enabled: true,
      secret: true,
    }, { ...params });
    vid13 = toUprmVid(uprm3).split('.').slice(-3).join('-');

    const pubkeyService = app.service('public-keys');
    const { publicKey: publicKey2 } = generateKeyPairSync('rsa', { modulusLength: 3072 });
    const pubKey2 = sshpk.parseKey(publicKey2.export({ type: 'pkcs1', format: 'pem' }), 'auto');
    fingerprint2 = pubKey2.fingerprint('sha256').toString();
    await pubkeyService.create(
      { publicKey: pubKey2.toString('pkcs1'), defaultKey: true },
      { ...paramsUser1 },
    );
    const { publicKey: publicKey1 } = generateKeyPairSync('rsa', { modulusLength: 3072 });
    const pubKey1 = sshpk.parseKey(publicKey1.export({ type: 'pkcs1', format: 'pem' }), 'auto');
    fingerprint1 = pubKey1.fingerprint('sha256').toString();
    await pubkeyService.create(
      { publicKey: pubKey1.toString('pkcs1'), defaultKey: true },
      { ...paramsUser1 },
    );

    const accessKeyService = app.service('access-keys');
    const accessKey = await accessKeyService.create({
      allPermitted: false,
      streams: [{ id: s1.id }],
    }, { ...paramsUser1 });
    secretId = accessKey.secretId;
    const accessKey0 = await accessKeyService.create({
      allPermitted: true,
    }, { ...params });
    secretId0 = accessKey0.secretId;
  });

  afterAll(async () => {
    await db('streams').del();
    await db('api_access_keys').del();
    await db('public_keys').del();
    await db('users').del();
  });
});
