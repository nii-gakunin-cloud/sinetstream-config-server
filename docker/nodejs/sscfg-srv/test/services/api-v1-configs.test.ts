import { Forbidden, NotFound } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { randomBytes } from 'crypto';
import { JSONPath } from 'jsonpath-plus';
import knex from 'knex';
import YAML from 'yaml';
import app from '../../src/app';
import { Users } from '../../src/models/users.model';

describe('\'api-v1-configs\' service', () => {
  let db: knex;
  const service = app.service('api/v1/configs');
  let user: Users;
  let user1: Users;
  let otherUser: Users;
  const test = { jest: true };
  const stream0 = 'config-000';
  const stream1 = 'config-001';
  const stream2 = 'config-002';
  const badStream = 'config-xxx';
  let sid1: number;
  let sid2: number;
  let secret1: string;
  let secret2: string;
  let secret3: string;
  let authentication: Record<string, any>;
  let params: Params;
  let paramsUser1: Params;
  let paramsOtherUser: Params;

  const configFile1 = `
  kafka-service:
    type: kafka
    brokers: kafka.example.org
    topic: topic-kafka-001
  mqtt-service:
    type: kafka
    brokers: mqtt.example.org
    topic: topic-mqtt-001
`;
  const configFile2 = `
  kafka2-service:
    type: kafka
    brokers: kafka.example.org
    topic: topic-kafka-002
`;
  const config1 = YAML.parse(configFile1);
  const config2 = YAML.parse(configFile2);

  describe('find', () => {
    describe('データ管理者', () => {
      it('検索の実行', async () => {
        expect.assertions(4);
        const ret = await service.find({ test, authentication });
        expect(ret).toBeInstanceOf(Array);
        // 設定ファイルが登録されていないものは除外される
        expect(ret.length).toBe(2);
        expect(ret).toContain(stream1);
        expect(ret).toContain(stream2);
      });

      beforeEach(async () => {
        const res = await app.service('authentication').create({
          user: user.name,
          'secret-key': secret1,
          strategy: 'api-access',
        }, {});
        const { payload, accessToken } = res.authentication;
        authentication = { strategy: 'jwt', accessToken, payload };
      });
    });

    describe('共同利用者', () => {
      it('検索の実行', async () => {
        expect.assertions(4);
        const ret = await service.find({ authentication, test });
        expect(ret).toBeInstanceOf(Array);
        // 設定ファイルが登録されていないものは除外される
        expect(ret.length).toBe(2);
        expect(ret).toContain(stream1);
        expect(ret).toContain(stream2);
      });

      beforeEach(async () => {
        const res = await app.service('authentication').create({
          user: user1.name,
          'secret-key': secret2,
          strategy: 'api-access',
        }, {});
        const { payload, accessToken } = res.authentication;
        authentication = { strategy: 'jwt', accessToken, payload };
      });
    });

    describe('利用範囲が限定されているアクセスキー', () => {
      it('検索の実行', async () => {
        expect.assertions(3);
        const ret = await service.find({ authentication, test });
        expect(ret).toBeInstanceOf(Array);
        expect(ret.length).toBe(1);
        expect(ret).toContain(stream1);
      });

      beforeEach(async () => {
        const accessKeyService = app.service('access-keys');
        const accessKey = await accessKeyService.create(
          { allPermitted: false, streams: [{ id: sid1 }] },
          { ...paramsUser1 },
        );
        const res = await app.service('authentication').create({
          user: user1.name,
          'secret-key': accessKey.secretId,
          strategy: 'api-access',
        }, {});
        const { payload, accessToken } = res.authentication;
        authentication = { strategy: 'jwt', accessToken, payload };
      });
    });

    describe('共同利用者以外', () => {
      it('検索の実行', async () => {
        expect.assertions(2);
        const ret = await service.find({ test, authentication });
        expect(ret).toBeInstanceOf(Array);
        expect(ret.length).toBe(0);
      });

      beforeEach(async () => {
        const res = await app.service('authentication').create({
          user: otherUser.name,
          'secret-key': secret3,
          strategy: 'api-access',
        }, {});
        const { payload, accessToken } = res.authentication;
        authentication = { strategy: 'jwt', accessToken, payload };
      });
    });
  });

  describe('get', () => {
    it.each([[stream1, config1], [stream2, config2]])('config', async (name, obj) => {
      expect.assertions(6);
      const ret = await service.get(name, { authentication, test });
      expect(ret.name).toBe(name);
      expect(ret.config).toEqual(obj);
      expect(ret.attachments).toBeInstanceOf(Array);
      expect(ret.attachments.length).toBe(0);
      expect(ret.secrets).toBeInstanceOf(Array);
      expect(ret.secrets.length).toBe(0);
    });

    describe('添付ファイル', () => {
      const target = '*.tls.ca_certs';
      const content = randomBytes(32).toString('base64');

      describe('有効フラグ: on', () => {
        const enabled = true;

        describe('secret=true', () => {
          it('REST APIの実行', async () => {
            expect.assertions(8);
            const ret = await service.get(stream1, { authentication, test });
            expect(ret.name).toBe(stream1);
            expect(ret.config.config).toEqual(config1);
            expect(ret.attachments).toBeInstanceOf(Array);
            expect(ret.attachments.length).toBe(0);
            expect(ret.secrets).toBeInstanceOf(Array);
            expect(ret.secrets.length).toBe(1);
            expect(ret.secrets[0].target).toBe(target);
            expect(ret.secrets[0].id).toBeDefined();
          });

          beforeEach(async () => {
            await app.service('attach-files').create({
              content,
              target,
              stream_id: sid1,
              enabled,
              secret: true,
            }, { ...params });
          });
        });

        describe('secret=false', () => {
          it('REST APIの実行', async () => {
            expect.assertions(8);
            const ret = await service.get(stream1, { authentication, test });
            expect(ret.name).toBe(stream1);
            expect(ret.config.config).toEqual(config1);
            expect(ret.attachments).toBeInstanceOf(Array);
            expect(ret.attachments.length).toBe(1);
            expect(ret.attachments[0].target).toBe(target);
            expect(ret.attachments[0].value).toBe(content);
            expect(ret.secrets).toBeInstanceOf(Array);
            expect(ret.secrets.length).toBe(0);
          });

          beforeEach(async () => {
            await app.service('attach-files').create({
              content,
              target,
              stream_id: sid1,
              enabled,
              secret: false,
            }, { ...params });
          });
        });
      });

      describe.each([true, false])('有効フラグ=off; secret=%p', (secret) => {
        const enabled = false;
        it('REST APIの実行', async () => {
          expect.assertions(6);
          const ret = await service.get(stream1, { authentication, test });
          expect(ret.name).toBe(stream1);
          expect(ret.config).toEqual(config1);
          expect(ret.attachments).toBeInstanceOf(Array);
          expect(ret.attachments.length).toBe(0);
          expect(ret.secrets).toBeInstanceOf(Array);
          expect(ret.secrets.length).toBe(0);
        });

        beforeEach(async () => {
          await app.service('attach-files').create({
            content,
            target,
            stream_id: sid1,
            enabled,
            secret,
          }, { ...params });
        });
      });
    });

    describe('ユーザパラメータ', () => {
      const target = '*.sasl_plain_password';
      describe('テキスト情報', () => {
        const textContent = 'abcdefgh';

        describe('有効フラグ: on', () => {
          const enabled = true;

          describe('secret=true', () => {
            it('REST APIの実行', async () => {
              expect.assertions(8);
              const ret = await service.get(stream1, { authentication, test });
              expect(ret.name).toBe(stream1);
              expect(ret.config.config).toEqual(config1);
              expect(ret.attachments).toBeInstanceOf(Array);
              expect(ret.attachments.length).toBe(0);
              expect(ret.secrets).toBeInstanceOf(Array);
              expect(ret.secrets.length).toBe(1);
              expect(ret.secrets[0].target).toBe(target);
              expect(ret.secrets[0].id).toBeDefined();
            });

            beforeEach(async () => {
              await app.service('user-parameters').create({
                textContent,
                target,
                stream_id: sid1,
                user_id: user.id,
                enabled,
                secret: true,
              }, { ...params });
            });
          });

          describe('secret=false', () => {
            it('REST APIの実行', async () => {
              expect.assertions(7);
              const ret = await service.get(stream1, { authentication, test });
              expect(ret.name).toBe(stream1);
              expect(ret.attachments).toBeInstanceOf(Array);
              expect(ret.attachments.length).toBe(0);
              expect(ret.secrets).toBeInstanceOf(Array);
              expect(ret.secrets.length).toBe(0);
              const res: string[] = JSONPath({
                path: `$.${target}`,
                json: ret.config.config,
              });
              expect(res.length).toBe(2);
              expect(res.every((x) => x === textContent)).toBe(true);
            });

            beforeEach(async () => {
              await app.service('user-parameters').create({
                textContent,
                target,
                stream_id: sid1,
                user_id: user.id,
                enabled,
                secret: false,
              }, { ...params });
            });
          });
        });

        describe.each([true, false])('有効フラグ=off; secret=%p', (secret) => {
          const enabled = false;
          it('REST APIの実行', async () => {
            expect.assertions(6);
            const ret = await service.get(stream1, { authentication, test });
            expect(ret.name).toBe(stream1);
            expect(ret.config).toEqual(config1);
            expect(ret.attachments).toBeInstanceOf(Array);
            expect(ret.attachments.length).toBe(0);
            expect(ret.secrets).toBeInstanceOf(Array);
            expect(ret.secrets.length).toBe(0);
          });

          beforeEach(async () => {
            await app.service('user-parameters').create({
              textContent,
              target,
              stream_id: sid1,
              user_id: user.id,
              enabled,
              secret,
            }, { ...params });
          });
        });
      });

      describe('バイナリ情報', () => {
        const content = randomBytes(32).toString('base64');

        describe('有効フラグ: on', () => {
          const enabled = true;

          describe('secret=true', () => {
            it('REST APIの実行', async () => {
              expect.assertions(8);
              const ret = await service.get(stream1, { authentication, test });
              expect(ret.name).toBe(stream1);
              expect(ret.config.config).toEqual(config1);
              expect(ret.attachments).toBeInstanceOf(Array);
              expect(ret.attachments.length).toBe(0);
              expect(ret.secrets).toBeInstanceOf(Array);
              expect(ret.secrets.length).toBe(1);
              expect(ret.secrets[0].target).toBe(target);
              expect(ret.secrets[0].id).toBeDefined();
            });

            beforeEach(async () => {
              await app.service('user-parameters').create({
                content,
                target,
                stream_id: sid1,
                user_id: user.id,
                enabled,
                secret: true,
              }, { ...params });
            });
          });

          describe('secret=false', () => {
            it('REST APIの実行', async () => {
              expect.assertions(8);
              const ret = await service.get(stream1, { authentication, test });
              expect(ret.name).toBe(stream1);
              expect(ret.config.config).toEqual(config1);
              expect(ret.attachments).toBeInstanceOf(Array);
              expect(ret.attachments.length).toBe(1);
              expect(ret.attachments[0].target).toBe(target);
              expect(ret.attachments[0].value).toBe(content);
              expect(ret.secrets).toBeInstanceOf(Array);
              expect(ret.secrets.length).toBe(0);
            });

            beforeEach(async () => {
              await app.service('user-parameters').create({
                content,
                target,
                stream_id: sid1,
                user_id: user.id,
                enabled,
                secret: false,
              }, { ...params });
            });
          });
        });

        describe.each([true, false])('有効フラグ=off; secret=%p', (secret) => {
          const enabled = false;

          it('REST APIの実行', async () => {
            expect.assertions(6);
            const ret = await service.get(stream1, { authentication, test });
            expect(ret.name).toBe(stream1);
            expect(ret.config).toEqual(config1);
            expect(ret.attachments).toBeInstanceOf(Array);
            expect(ret.attachments.length).toBe(0);
            expect(ret.secrets).toBeInstanceOf(Array);
            expect(ret.secrets.length).toBe(0);
          });

          beforeEach(async () => {
            await app.service('user-parameters').create({
              content,
              target,
              stream_id: sid1,
              user_id: user.id,
              enabled,
              secret,
            }, { ...params });
          });
        });
      });

      describe('他ユーザのパラメータを取得できないこと', () => {
        const content = randomBytes(32).toString('base64');
        const content1 = randomBytes(32).toString('base64');

        describe('secret=true', () => {
          const secret = true;
          it('REST APIの実行', async () => {
            expect.assertions(8);
            const ret = await service.get(stream1, { authentication, test });
            expect(ret.name).toBe(stream1);
            expect(ret.config.config).toEqual(config1);
            expect(ret.attachments).toBeInstanceOf(Array);
            expect(ret.attachments.length).toBe(0);
            expect(ret.secrets).toBeInstanceOf(Array);
            expect(ret.secrets.length).toBe(1);
            expect(ret.secrets[0].target).toBe(target);
            expect(ret.secrets[0].id).toBeDefined();
          });

          beforeEach(async () => {
            await app.service('user-parameters').create({
              content,
              target,
              stream_id: sid1,
              user_id: user.id,
              enabled: true,
              secret,
            }, { ...params });
            await app.service('user-parameters').create({
              content: content1,
              target,
              stream_id: sid1,
              user_id: user1.id,
              enabled: true,
              secret,
            }, { ...params });
          });
        });

        describe('secret=false', () => {
          const secret = false;
          it('REST APIの実行', async () => {
            expect.assertions(8);
            const ret = await service.get(stream1, { authentication, test });
            expect(ret.name).toBe(stream1);
            expect(ret.config.config).toEqual(config1);
            expect(ret.attachments).toBeInstanceOf(Array);
            expect(ret.attachments.length).toBe(1);
            expect(ret.attachments[0].target).toBe(target);
            expect(ret.attachments[0].value).toBe(content);
            expect(ret.secrets).toBeInstanceOf(Array);
            expect(ret.secrets.length).toBe(0);
          });

          beforeEach(async () => {
            await app.service('user-parameters').create({
              content,
              target,
              stream_id: sid1,
              user_id: user.id,
              enabled: true,
              secret,
            }, { ...params });
            await app.service('user-parameters').create({
              content: content1,
              target,
              stream_id: sid1,
              user_id: user1.id,
              enabled: true,
              secret,
            }, { ...params });
          });
        });
      });
    });

    describe('データ暗号鍵', () => {
      const keySize = 256;
      const target = '*.crypto.key';

      describe('有効フラグ: on', () => {
        const enabled = true;

        it('version1', async () => {
          expect.assertions(11);
          const ret = await service.get(stream1, { authentication, test });
          expect(ret.name).toBe(stream1);
          expect(ret.config.config).toEqual(config1);
          expect(ret.attachments).toBeInstanceOf(Array);
          expect(ret.attachments.length).toBe(0);
          expect(ret.secrets).toBeInstanceOf(Array);
          expect(ret.secrets.length).toBe(1);

          expect(ret.secrets[0].target).toBe(target);
          expect(ret.secrets[0].ids).toBeInstanceOf(Array);
          expect(ret.secrets[0].ids.length).toBe(1);
          expect(ret.secrets[0].ids[0].version).toBe(1);
          expect(ret.secrets[0].ids[0].id).toBeDefined();
        });

        describe('複数バージョンが存在する場合', () => {
          it('version3', async () => {
            expect.assertions(15);
            const ret = await service.get(stream1, { authentication, test });
            expect(ret.name).toBe(stream1);
            expect(ret.config.config).toEqual(config1);
            expect(ret.attachments).toBeInstanceOf(Array);
            expect(ret.attachments.length).toBe(0);
            expect(ret.secrets).toBeInstanceOf(Array);
            expect(ret.secrets.length).toBe(1);

            const secret = ret.secrets[0];
            expect(secret.target).toBe(target);
            expect(secret.ids).toBeInstanceOf(Array);
            expect(secret.ids.length).toBe(3);
            for (let i = 0; i < secret.ids.length; i += 1) {
              expect(secret.ids[i].version).toBe(secret.ids.length - i);
              expect(secret.ids[i].id).toBeDefined();
            }
          });

          beforeEach(async () => {
            await app.service('encrypt-keys').create({
              size: keySize,
              target,
              stream_id: sid1,
              enabled,
            }, { ...params });
            await app.service('encrypt-keys').create({
              size: keySize,
              target,
              stream_id: sid1,
              enabled,
            }, { ...params });
          });
        });

        beforeEach(async () => {
          await app.service('encrypt-keys').create({
            size: keySize,
            target,
            stream_id: sid1,
            enabled,
          }, { ...params });
        });
      });

      describe('有効フラグ: off', () => {
        const enabled = false;

        it('version1', async () => {
          expect.assertions(6);
          const ret = await service.get(stream1, { authentication, test });
          expect(ret.name).toBe(stream1);
          expect(ret.config.config).toEqual(config1);
          expect(ret.attachments).toBeInstanceOf(Array);
          expect(ret.attachments.length).toBe(0);
          expect(ret.secrets).toBeInstanceOf(Array);
          expect(ret.secrets.length).toBe(0);
        });

        describe('複数バージョンが存在する場合', () => {
          it('version3', async () => {
            expect.assertions(6);
            const ret = await service.get(stream1, { authentication, test });
            expect(ret.name).toBe(stream1);
            expect(ret.config.config).toEqual(config1);
            expect(ret.attachments).toBeInstanceOf(Array);
            expect(ret.attachments.length).toBe(0);
            expect(ret.secrets).toBeInstanceOf(Array);
            expect(ret.secrets.length).toBe(0);
          });

          beforeEach(async () => {
            await app.service('encrypt-keys').create({
              size: keySize,
              target,
              stream_id: sid1,
              enabled,
            }, { ...params });
            await app.service('encrypt-keys').create({
              size: keySize,
              target,
              stream_id: sid1,
              enabled,
            }, { ...params });
          });
        });

        beforeEach(async () => {
          await app.service('encrypt-keys').create({
            size: keySize,
            target,
            stream_id: sid1,
            enabled,
          }, { ...params });
        });
      });
    });

    describe('異常系', () => {
      it('存在していないID', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(badStream, { authentication, test });
        }).rejects.toThrowError(NotFound);
      });

      it('設定ファイルが登録されていない', async () => {
        // 設定ファイルが登録されていないコンフィグ情報の場合、検索結果には含まれないが
        // Not Foundとはならず、空の値が返る
        expect.assertions(7);
        const ret = await service.get(stream0, { authentication, test });
        expect(ret.name).toBe(stream0);
        expect(ret.config).toBeInstanceOf(Object);
        expect(Object.keys(ret.config).length).toBe(0);
        expect(ret.attachments).toBeInstanceOf(Array);
        expect(ret.attachments.length).toBe(0);
        expect(ret.secrets).toBeInstanceOf(Array);
        expect(ret.secrets.length).toBe(0);
      });

      describe('共同利用者以外', () => {
        it('APIの実行', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.get(stream1, { authentication, test });
          }).rejects.toThrowError(NotFound);
        });

        beforeEach(async () => {
          const res = await app.service('authentication').create({
            user: otherUser.name,
            'secret-key': secret3,
            strategy: 'api-access',
          }, {});
          const { payload, accessToken } = res.authentication;
          authentication = { strategy: 'jwt', accessToken, payload };
        });
      });

      describe('アクセスキーの対象外', () => {
        it('APIの実行', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.get(stream1, { authentication, test });
          }).rejects.toThrowError(Forbidden);
        });

        beforeEach(async () => {
          const accessKeyService = app.service('access-keys');
          const accessKey = await accessKeyService.create(
            { allPermitted: false, streams: [{ id: sid2 }] },
            { ...params },
          );
          const res = await app.service('authentication').create({
            user: user.name,
            'secret-key': accessKey.secretId,
            strategy: 'api-access',
          }, {});
          const { payload, accessToken } = res.authentication;
          authentication = { strategy: 'jwt', accessToken, payload };
        });
      });
    });

    beforeEach(async () => {
      const res = await app.service('authentication').create({
        user: user.name,
        'secret-key': secret1,
        strategy: 'api-access',
      }, {});
      const { payload, accessToken } = res.authentication;
      authentication = { strategy: 'jwt', accessToken, payload };
    });
  });

  beforeEach(async () => {
    await db('streams').del();
    const s0 = await app.service('streams').create(
      { name: stream0 },
      { ...params },
    );
    await db('members').insert({ user_id: user1.id, stream_id: s0.id });
    const s1 = await app.service('streams').create(
      { name: stream1, configFile: configFile1 },
      { ...params },
    );
    sid1 = s1.id;
    await db('members').insert({ user_id: user1.id, stream_id: sid1 });
    const s2 = await app.service('streams').create(
      { name: stream2, configFile: configFile2 },
      { ...params },
    );
    sid2 = s2.id;
    await db('members').insert({ user_id: user1.id, stream_id: sid2 });
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
  const otherUserInfo = {
    name: 'user02',
    password: 'pass02',
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
    await db('users').del();

    await db('users').insert(adminInfo);
    const userService = app.service('users');
    const [admin] = ((await userService.find({ query: { name: adminInfo.name } })) as Users[]);
    user = await userService.create(userInfo, { user: admin });
    user1 = await userService.create(user1Info, { user: admin });
    otherUser = await userService.create(otherUserInfo, { user: admin });
    const authentication0 = await getAuthentication(userInfo);
    const authentication1 = await getAuthentication(user1Info);
    const authentication2 = await getAuthentication(otherUserInfo);
    params = { user, authentication: authentication0, test };
    paramsUser1 = { user: user1, authentication: authentication1, test };
    paramsOtherUser = { user: otherUser, authentication: authentication2, test };

    const accessKeyService = app.service('access-keys');
    const accessKey1 = await accessKeyService.create(
      { allPermitted: true }, { ...params },
    );
    secret1 = accessKey1.secretId;
    const accessKey2 = await accessKeyService.create(
      { allPermitted: true }, { ...paramsUser1 },
    );
    secret2 = accessKey2.secretId;
    const accessKey3 = await accessKeyService.create(
      { allPermitted: true }, { ...paramsOtherUser },
    );
    secret3 = accessKey3.secretId;
  });

  afterAll(async () => {
    await db('streams').del();
    await db('api_access_keys').del();
    await db('users').del();
  });
});
