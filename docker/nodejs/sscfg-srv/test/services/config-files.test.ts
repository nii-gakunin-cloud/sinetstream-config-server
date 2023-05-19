import { BadRequest, NotFound } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { generateKeyPairSync, KeyObject, randomBytes } from 'crypto';
import { Knex } from 'knex';
import YAML from 'yaml';
import app from '../../src/app';
import { toVid as toAfileVid } from '../../src/hooks/process-attach-files';
import { toVid as toEkeyVid } from '../../src/hooks/process-encrypt-keys';
import { toVid as toUParamVid } from '../../src/hooks/process-user-parameters';
import { AttachFiles } from '../../src/models/attach-files.model';
import { EncryptKeys } from '../../src/models/encrypt-keys.model';
import { Streams } from '../../src/models/streams.model';
import { UserParameters } from '../../src/models/user-parameters.model';
import { Users } from '../../src/models/users.model';
import {
  BadFileFormat, binaryTag, SecretData, sinetstreamEncrypt,
} from '../../src/utils/sinetstreamConfigFile';

describe('\'config-files\' service', () => {
  let user: Users;
  let user1: Users;
  let otherUser: Users;
  let stream: Streams;
  let pubKey: KeyObject;
  let privKey: KeyObject;
  let db: Knex;
  let params0: Params;
  let params: Params;
  let fingerprint: string;
  const service = app.service('config-files');
  const encryptKeyTarget = '*.crypto.key';
  const encryptKey1 = randomBytes(256 / 8).toString('base64');
  const encryptKey2 = randomBytes(256 / 8).toString('base64');
  const attachFileTarget = '*.tls.ca_certs';
  const attachFileContent = randomBytes(32).toString('base64');
  const userParameterTarget1 = '*.sasl_plain_username';
  const userParameterTarget2 = '*.sasl_plain_password';
  const userParameterTextValue = 'abcdefgh';
  const userParameterBinaryValue = randomBytes(32).toString('base64');
  const streamName = 'stream-001';
  const topic1 = 'kafka-topic-001';
  const topic2 = 'mqtt-topic-002';
  const sname1 = 'service-kafka';
  const sname2 = 'service-mqtt';
  const targetX = '*.type.crypto.key';
  const configFileV2 = (topicA = topic1, topicB = topic2, version = 2) => (`
# header comment
header:
  version: ${version}

config:
  # service-1
  ${sname1}:
    type: kafka
    brokers:
      - kafka0:9092
      - kafka1:9092
    topic: ${topicA} # topic-1

  # service-2
  ${sname2}:
    type: mqtt
    brokers: mqtt:1883
    topic: ${topicB} # topic-2
`.trim());
  const configFileV1 = (topicA = topic1, topicB = topic2) => (YAML.stringify(
    YAML.parseDocument(configFileV2(topicA, topicB)).get('config'),
  ).trim());
  const user0Info = {
    name: 'user00',
    password: 'pass00',
  };
  const user1Info = {
    name: 'user01',
    password: 'pass01',
  };
  const configFileX = (topicA = topic1, topicB = topic2) => (`
header:
  version: 2
config:
  ${sname1}:
    type: kafka
    brokers:
       - kafka0:9092
      - kafka1:9092
    topic: ${topicA} # topic-1
  ${sname2}:
    type: mqtt
    brokers: mqtt:1883
    topic: ${topicB} # topic-2
`.trim());
  const otherUserInfo = {
    name: 'user02',
    password: 'pass02',
  };
  const getAuthentication = async (
    uinfo: Record<string, string>,
  ): Promise<Record<string, any>> => {
    const res = await app.service('authentication').create({ ...uinfo, strategy: 'local' }, {});
    const { payload, accessToken } = res.authentication;
    return { strategy: 'jwt', accessToken, payload };
  };

  describe('取得内容の確認', () => {
    describe('埋め込みがない場合', () => {
      describe.each([
        ['v1', configFileV1()],
        ['v2', configFileV2()],
      ])('ファイルフォーマット: %s', (label, configFile) => {
        describe.each([
          ['データ管理者', user0Info],
          ['共同利用者', user1Info],
        ])('利用者: %s', (userLabel, userInfo) => {
          it('default', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { ...params });
            expect(res.name).toBe(streamName);
            expect(res.yaml?.trim()).toBe(configFile);
          });

          it('yaml', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'yaml' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.yaml?.trim()).toBe(configFile);
          });

          it('config', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'object' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.config).toEqual(YAML.parse(configFile));
          });

          it('attachments', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.attachments).toHaveLength(0);
          });

          it('secrets', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.secrets).toHaveLength(0);
          });

          beforeEach(async () => {
            const [u] = ((await app.service('users').find(
              { query: { name: userInfo.name } },
            )) as Users[]);
            const authentication = await getAuthentication(userInfo);
            params = { user: u, authentication, test: { jest: true } };
          });
        });

        describe('共同利用者でない場合', () => {
          it.each([
            ['default', {}],
            ['default', { $select: 'yaml' }],
            ['config', { $select: 'object' }],
            ['attachments', { $select: 'attachments' }],
            ['secrets', { $select: 'secrets' }],
          ])('query: %s', async (lbl, query) => {
            await expect(async () => {
              await service.get(stream.id, { query, ...params });
            }).rejects.toThrowError(NotFound);
          });

          beforeEach(async () => {
            const authentication = await getAuthentication(otherUserInfo);
            params = { user: otherUser, authentication, test: { jest: true } };
          });
        });

        beforeEach(async () => {
          await db('streams').del();
          stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
          await app.service('members').create({ user_id: user1.id, stream_id: stream.id }, { ...params0 });
        });
      });
    });

    describe('データ暗号鍵', () => {
      let ekey1: EncryptKeys;
      describe.each([
        ['v1', configFileV1()],
        ['v2', configFileV2()],
      ])('ファイルフォーマット: %s', (label, configFile) => {
        describe.each([
          ['データ管理者', user0Info],
          ['共同利用者', user1Info],
        ])('利用者: %s', (userLabel, userInfo) => {
          const toVid = (ekey: EncryptKeys) => (toEkeyVid(ekey).split('.').slice(-2).join('-'));

          describe('一つのバージョンのみの場合', () => {
            it.each([
              ['default', {}],
              ['yaml', { $select: 'yaml' }],
            ])('yaml: %s', async (lbl, query) => {
              expect.assertions(5);
              const res = await service.get(
                stream.id,
                { query, ...params },
              );
              expect(res.name).toBe(streamName);
              const obj0 = YAML.parse(configFileV2());
              if (res.yaml != null) {
                const obj = YAML.parse(res.yaml, { customTags: [sinetstreamEncrypt] });
                expect(obj).toMatchObject(obj0);
                expect(obj.header.fingerprint).toBe(fingerprint);
                [sname1, sname2].forEach((sname) => {
                  const sec: SecretData = obj.config[sname].crypto.key;
                  expect(sec.decrypt(privKey).toString('base64')).toBe(encryptKey1);
                });
              }
            });

            it('config', async () => {
              expect.assertions(2);
              const res = await service.get(
                stream.id,
                { query: { $select: 'object', $embed: 'text' }, ...params },
              );
              expect(res.name).toBe(streamName);
              expect(res.config).toEqual(YAML.parse(configFileV2()));
            });

            it('attachments', async () => {
              expect.assertions(2);
              const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
              expect(res.name).toBe(streamName);
              expect(res.attachments).toHaveLength(0);
            });

            it('secrets', async () => {
              expect.assertions(2);
              const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
              expect(res.name).toBe(streamName);
              expect(res.secrets).toMatchObject([
                { target: encryptKeyTarget, ids: [{ version: 1, id: toVid(ekey1) }] },
              ]);
            });
          });

          describe('複数のバージョンをもつ場合', () => {
            let ekey2: EncryptKeys;

            it.each([
              ['default', {}],
              ['yaml', { $select: 'yaml' }],
            ])('yaml: %s', async (lbl, query) => {
              expect.assertions(5);
              const res = await service.get(
                stream.id,
                { query, ...params },
              );
              expect(res.name).toBe(streamName);
              const obj0 = YAML.parse(configFileV2());
              if (res.yaml != null) {
                const obj = YAML.parse(res.yaml, { customTags: [sinetstreamEncrypt] });
                expect(obj).toMatchObject(obj0);
                expect(obj.header.fingerprint).toBe(fingerprint);
                [sname1, sname2].forEach((sname) => {
                  const sec: SecretData = obj.config[sname].crypto.key;
                  expect(sec.decrypt(privKey).toString('base64')).toBe(encryptKey2);
                });
              }
            });

            it('config', async () => {
              expect.assertions(2);
              const res = await service.get(
                stream.id,
                { query: { $select: 'object', $embed: 'text' }, ...params },
              );
              expect(res.name).toBe(streamName);
              expect(res.config).toEqual(YAML.parse(configFileV2()));
            });

            it('attachments', async () => {
              expect.assertions(2);
              const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
              expect(res.name).toBe(streamName);
              expect(res.attachments).toHaveLength(0);
            });

            it('secrets', async () => {
              expect.assertions(2);
              const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
              expect(res.name).toBe(streamName);
              expect(res.secrets).toMatchObject([
                {
                  target: encryptKeyTarget,
                  ids: [
                    { version: 2, id: toVid(ekey2) },
                    { version: 1, id: toVid(ekey1) },
                  ],
                },
              ]);
            });

            beforeEach(async () => {
              ekey2 = await app.service('encrypt-keys').create(
                {
                  size: 256,
                  target: encryptKeyTarget,
                  key: encryptKey2,
                  stream_id: stream.id,
                  enabled: true,
                },
                { ...params0 },
              );
            });
          });

          describe('有効フラグがオフの場合', () => {
            it.each([
              ['default', {}],
              ['yaml', { $select: 'yaml' }],
            ])('yaml: %s', async (lbl, query) => {
              expect.assertions(2);
              const res = await service.get(
                stream.id,
                { query, ...params },
              );
              expect(res.name).toBe(streamName);
              const v2 = configFileV2();
              if (configFile === v2) {
                expect(res.yaml?.trim()).toBe(configFile);
              } else if (res.yaml != null) {
                expect(YAML.parse(res.yaml)).toEqual(YAML.parse(v2));
              }
            });

            it('config', async () => {
              expect.assertions(2);
              const res = await service.get(
                stream.id,
                { query: { $select: 'object', $embed: 'text' }, ...params },
              );
              expect(res.name).toBe(streamName);
              expect(res.config).toEqual(YAML.parse(configFileV2()));
            });

            it('attachments', async () => {
              expect.assertions(2);
              const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
              expect(res.name).toBe(streamName);
              expect(res.attachments).toHaveLength(0);
            });

            it('secrets', async () => {
              expect.assertions(2);
              const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
              expect(res.name).toBe(streamName);
              expect(res.secrets).toHaveLength(0);
            });

            beforeEach(async () => {
              await app.service('encrypt-keys').patch(ekey1.id, { enabled: false }, { ...params0 });
            });
          });

          beforeEach(async () => {
            await db('public_keys').del();
            const [u] = ((await app.service('users').find(
              { query: { name: userInfo.name } },
            )) as Users[]);
            const authentication = await getAuthentication(userInfo);
            params = { user: u, authentication, test: { jest: true } };
            const ret = await app.service('public-keys').create({
              defaultKey: true,
              publicKey: pubKey.export({ type: 'pkcs1', format: 'pem' }),
            }, { ...params });
            fingerprint = ret.fingerprint;
          });
        });

        describe('共同利用者でない場合', () => {
          it.each([
            ['default', {}],
            ['default', { $select: 'yaml' }],
            ['config', { $select: 'object' }],
            ['attachments', { $select: 'attachments' }],
            ['secrets', { $select: 'secrets' }],
          ])('query: %s', async (lbl, query) => {
            await expect(async () => {
              await service.get(stream.id, { query, ...params });
            }).rejects.toThrowError(NotFound);
          });

          beforeEach(async () => {
            const authentication = await getAuthentication(otherUserInfo);
            params = { user: otherUser, authentication, test: { jest: true } };
          });
        });

        beforeEach(async () => {
          await db('streams').del();
          stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
          await app.service('members').create({ user_id: user1.id, stream_id: stream.id }, { ...params0 });
          ekey1 = await app.service('encrypt-keys').create(
            {
              size: 256,
              target: encryptKeyTarget,
              key: encryptKey1,
              stream_id: stream.id,
              enabled: true,
            },
            { ...params0 },
          );
        });
      });
    });

    describe('添付ファイル', () => {
      let attachFile: AttachFiles;

      describe.each([
        ['v1', configFileV1()],
        ['v2', configFileV2()],
      ])('ファイルフォーマット: %s', (label, configFile) => {
        describe.each([
          ['データ管理者', user0Info],
          ['共同利用者', user1Info],
        ])('利用者: %s', (userLabel, userInfo) => {
          describe('秘匿情報でない場合', () => {
            describe('有効フラグオン', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(4);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                const obj0 = YAML.parse(configFileV2());
                if (res.yaml != null) {
                  const obj = YAML.parse(res.yaml, { customTags: [binaryTag, sinetstreamEncrypt] });
                  expect(obj).toMatchObject(obj0);
                  [sname1, sname2].forEach((sname) => {
                    expect(
                      obj.config[sname].tls.ca_certs.toString('base64'),
                    ).toBe(attachFileContent);
                  });
                }
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFileV2()));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toMatchObject([
                  {
                    target: attachFileTarget,
                    value: attachFileContent,
                  },
                ]);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toHaveLength(0);
              });
            });

            describe('有効フラグオフ', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.yaml?.trim()).toBe(configFile);
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFile));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toHaveLength(0);
              });

              beforeEach(async () => {
                await app.service('attach-files').patch(
                  attachFile.id,
                  { enabled: false },
                  { ...params0 },
                );
              });
            });

            beforeEach(async () => {
              attachFile = await app.service('attach-files').create({
                content: attachFileContent,
                target: attachFileTarget,
                stream_id: stream.id,
                enabled: true,
                secret: false,
              }, { ...params0 });
            });
          });

          describe('秘匿情報の場合', () => {
            const toVid = (afile: AttachFiles) => (toAfileVid(afile).split('.').slice(-2).join('-'));

            describe('有効フラグオン', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(4);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                const obj0 = YAML.parse(configFileV2());
                if (res.yaml != null) {
                  const obj = YAML.parse(res.yaml, { customTags: [binaryTag, sinetstreamEncrypt] });
                  expect(obj).toMatchObject(obj0);
                  [sname1, sname2].forEach((sname) => {
                    const sec: SecretData = obj.config[sname].tls.ca_certs;
                    expect(sec.decrypt(privKey).toString('base64')).toBe(attachFileContent);
                  });
                }
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFileV2()));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toMatchObject([
                  { target: attachFileTarget, id: toVid(attachFile) },
                ]);
              });
            });

            describe('有効フラグオフ', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.yaml?.trim()).toBe(configFile);
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFile));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toHaveLength(0);
              });

              beforeEach(async () => {
                await app.service('attach-files').patch(
                  attachFile.id,
                  { enabled: false },
                  { ...params0 },
                );
              });
            });

            beforeEach(async () => {
              attachFile = await app.service('attach-files').create({
                content: attachFileContent,
                target: attachFileTarget,
                stream_id: stream.id,
                enabled: true,
                secret: true,
              }, { ...params0 });
            });
          });

          beforeEach(async () => {
            await db('public_keys').del();
            const [u] = ((await app.service('users').find(
              { query: { name: userInfo.name } },
            )) as Users[]);
            const authentication = await getAuthentication(userInfo);
            params = { user: u, authentication, test: { jest: true } };
            const ret = await app.service('public-keys').create({
              defaultKey: true,
              publicKey: pubKey.export({ type: 'pkcs1', format: 'pem' }),
            }, { ...params });
            fingerprint = ret.fingerprint;
          });
        });

        describe('共同利用者でない場合', () => {
          it.each([
            ['default', {}],
            ['default', { $select: 'yaml' }],
            ['config', { $select: 'object' }],
            ['attachments', { $select: 'attachments' }],
            ['secrets', { $select: 'secrets' }],
          ])('query: %s', async (lbl, query) => {
            await expect(async () => {
              await service.get(stream.id, { query, ...params });
            }).rejects.toThrowError(NotFound);
          });

          beforeEach(async () => {
            const authentication = await getAuthentication(otherUserInfo);
            params = { user: otherUser, authentication, test: { jest: true } };
            attachFile = await app.service('attach-files').create({
              content: attachFileContent,
              target: attachFileTarget,
              stream_id: stream.id,
              enabled: true,
              secret: true,
            }, { ...params0 });
          });
        });

        beforeEach(async () => {
          await db('streams').del();
          stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
          await app.service('members').create({ user_id: user1.id, stream_id: stream.id }, { ...params0 });
        });
      });
    });

    describe('ユーザパラメータ', () => {
      let uParam: UserParameters;

      describe.each([
        ['v1', configFileV1()],
        ['v2', configFileV2()],
      ])('ユーザパラメータ: %s', (label, configFile) => {
        describe.each([
          ['データ管理者', user0Info],
          ['共同利用者', user1Info],
        ])('利用者: %s', (userLabel, userInfo) => {
          const toVid = (up: UserParameters) => {
            const vid = toUParamVid(up).split('.').slice(-3);
            return `${vid[0]}-${vid[2]}`;
          };

          describe('秘匿情報でないテキスト値', () => {
            describe('有効フラグオン', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(4);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                const obj0 = YAML.parse(configFileV2());
                if (res.yaml != null) {
                  const obj = YAML.parse(res.yaml);
                  expect(obj).toMatchObject(obj0);
                  [sname1, sname2].forEach((sname) => {
                    expect(
                      obj.config[sname].sasl_plain_username,
                    ).toBe(userParameterTextValue);
                  });
                }
              });

              it('config', async () => {
                expect.assertions(4);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toMatchObject(YAML.parse(configFileV2()));
                [sname1, sname2].forEach((sname) => {
                  expect(
                    res.config?.config[sname].sasl_plain_username,
                  ).toBe(userParameterTextValue);
                });
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toHaveLength(0);
              });
            });

            describe('有効フラグオフ', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.yaml?.trim()).toBe(configFile);
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFile));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toHaveLength(0);
              });

              beforeEach(async () => {
                await app.service('user-parameters').patch(
                  uParam.id,
                  { enabled: false },
                  { ...params0 },
                );
              });
            });

            beforeEach(async () => {
              const [u] = ((await app.service('users').find(
                { query: { name: userInfo.name } },
              )) as Users[]);
              uParam = await app.service('user-parameters').create({
                textContent: userParameterTextValue,
                target: userParameterTarget1,
                stream_id: stream.id,
                user_id: u.id,
                enabled: true,
                secret: false,
              }, { ...params0 });
            });
          });

          describe('秘匿情報でないバイナリ値', () => {
            describe('有効フラグオン', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(4);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                const obj0 = YAML.parse(configFileV2());
                if (res.yaml != null) {
                  const obj = YAML.parse(res.yaml);
                  expect(obj).toMatchObject(obj0);
                  [sname1, sname2].forEach((sname) => {
                    expect(
                      obj.config[sname].sasl_plain_username.toString('base64'),
                    ).toBe(userParameterBinaryValue);
                  });
                }
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFileV2()));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toMatchObject([
                  {
                    target: userParameterTarget1,
                    value: userParameterBinaryValue,
                  },
                ]);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toHaveLength(0);
              });
            });

            describe('有効フラグオフ', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.yaml?.trim()).toBe(configFile);
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFile));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toHaveLength(0);
              });

              beforeEach(async () => {
                await app.service('user-parameters').patch(
                  uParam.id,
                  { enabled: false },
                  { ...params0 },
                );
              });
            });

            beforeEach(async () => {
              const [u] = ((await app.service('users').find(
                { query: { name: userInfo.name } },
              )) as Users[]);
              uParam = await app.service('user-parameters').create({
                content: userParameterBinaryValue,
                target: userParameterTarget1,
                stream_id: stream.id,
                user_id: u.id,
                enabled: true,
                secret: false,
              }, { ...params0 });
            });
          });

          describe('秘匿情報のテキスト値', () => {
            describe('有効フラグオン', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('yaml: %s', async (lbl, query) => {
                expect.assertions(4);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                const obj0 = YAML.parse(configFileV2());
                if (res.yaml != null) {
                  const obj = YAML.parse(res.yaml, { customTags: [sinetstreamEncrypt] });
                  expect(obj).toMatchObject(obj0);
                  [sname1, sname2].forEach((sname) => {
                    const sec: SecretData = obj.config[sname].sasl_plain_username;
                    expect(sec.decrypt(privKey).toString()).toBe(userParameterTextValue);
                  });
                }
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFileV2()));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toMatchObject([
                  { target: userParameterTarget1, id: toVid(uParam) },
                ]);
              });
            });

            describe('有効フラグオフ', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.yaml?.trim()).toBe(configFile);
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFile));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toHaveLength(0);
              });

              beforeEach(async () => {
                await app.service('user-parameters').patch(
                  uParam.id,
                  { enabled: false },
                  { ...params0 },
                );
              });
            });

            beforeEach(async () => {
              const [u] = ((await app.service('users').find(
                { query: { name: userInfo.name } },
              )) as Users[]);
              uParam = await app.service('user-parameters').create({
                textContent: userParameterTextValue,
                target: userParameterTarget1,
                stream_id: stream.id,
                user_id: u.id,
                enabled: true,
                secret: true,
              }, { ...params0 });
            });
          });

          describe('秘匿情報のバイナリ値', () => {
            describe('有効フラグオン', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('yaml: %s', async (lbl, query) => {
                expect.assertions(4);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                const obj0 = YAML.parse(configFileV2());
                if (res.yaml != null) {
                  const obj = YAML.parse(res.yaml, { customTags: [sinetstreamEncrypt] });
                  expect(obj).toMatchObject(obj0);
                  [sname1, sname2].forEach((sname) => {
                    const sec: SecretData = obj.config[sname].sasl_plain_password;
                    expect(sec.decrypt(privKey).toString('base64')).toBe(userParameterBinaryValue);
                  });
                }
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFileV2()));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toMatchObject([
                  { target: userParameterTarget2, id: toVid(uParam) },
                ]);
              });
            });

            describe('有効フラグオフ', () => {
              it.each([
                ['default', {}],
                ['yaml', { $select: 'yaml' }],
              ])('%s', async (lbl, query) => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.yaml?.trim()).toBe(configFile);
              });

              it('config', async () => {
                expect.assertions(2);
                const res = await service.get(
                  stream.id,
                  { query: { $select: 'object', $embed: 'text' }, ...params },
                );
                expect(res.name).toBe(streamName);
                expect(res.config).toEqual(YAML.parse(configFile));
              });

              it('attachments', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.attachments).toHaveLength(0);
              });

              it('secrets', async () => {
                expect.assertions(2);
                const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
                expect(res.name).toBe(streamName);
                expect(res.secrets).toHaveLength(0);
              });

              beforeEach(async () => {
                await app.service('user-parameters').patch(
                  uParam.id,
                  { enabled: false },
                  { ...params0 },
                );
              });
            });

            beforeEach(async () => {
              const [u] = ((await app.service('users').find(
                { query: { name: userInfo.name } },
              )) as Users[]);
              uParam = await app.service('user-parameters').create({
                content: userParameterBinaryValue,
                target: userParameterTarget2,
                stream_id: stream.id,
                user_id: u.id,
                enabled: true,
                secret: true,
              }, { ...params0 });
            });
          });

          beforeEach(async () => {
            await db('public_keys').del();
            const [u] = ((await app.service('users').find(
              { query: { name: userInfo.name } },
            )) as Users[]);
            const authentication = await getAuthentication(userInfo);
            params = { user: u, authentication, test: { jest: true } };
            const ret = await app.service('public-keys').create({
              defaultKey: true,
              publicKey: pubKey.export({ type: 'pkcs1', format: 'pem' }),
            }, { ...params });
            fingerprint = ret.fingerprint;
          });
        });

        describe('共同利用者でない場合', () => {
          it.each([
            ['default', {}],
            ['default', { $select: 'yaml' }],
            ['config', { $select: 'object' }],
            ['attachments', { $select: 'attachments' }],
            ['secrets', { $select: 'secrets' }],
          ])('query: %s', async (lbl, query) => {
            await expect(async () => {
              await service.get(stream.id, { query, ...params });
            }).rejects.toThrowError(NotFound);
          });

          beforeEach(async () => {
            const authentication = await getAuthentication(otherUserInfo);
            params = { user: otherUser, authentication, test: { jest: true } };
            uParam = await app.service('user-parameters').create({
              content: userParameterBinaryValue,
              target: userParameterTarget2,
              stream_id: stream.id,
              user_id: user.id,
              enabled: true,
              secret: true,
            }, { ...params0 });
          });
        });

        beforeEach(async () => {
          await db('streams').del();
          stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
          await app.service('members').create({ user_id: user1.id, stream_id: stream.id }, { ...params0 });
        });
      });
    });
  });

  describe('ユーザ公開鍵が登録されていない場合', () => {
    describe('データ暗号鍵', () => {
      let ekey1: EncryptKeys;
      const configFile = configFileV2();
      const toVid = (ekey: EncryptKeys) => (toEkeyVid(ekey).split('.').slice(-2).join('-'));

      describe('一つのバージョンのみの場合', () => {
        it.each([
          ['default', {}],
          ['yaml', { $select: 'yaml' }],
        ])('yaml: %s', async (lbl, query) => {
          expect.assertions(6);
          const res = await service.get(
            stream.id,
            { query, ...params },
          );
          expect(res.name).toBe(streamName);
          expect(res?.yaml?.startsWith('# 警告: ')).toBeTruthy();
          const obj0 = YAML.parse(configFileV2());
          if (res.yaml != null) {
            const obj = YAML.parse(res.yaml, { customTags: [sinetstreamEncrypt] });
            expect(obj).toMatchObject(obj0);
            expect(obj.header.fingerprint).toBeUndefined();
            [sname1, sname2].forEach((sname) => {
              expect(obj.config[sname].crypto).toBeUndefined();
            });
          }
        });

        it('config', async () => {
          expect.assertions(2);
          const res = await service.get(
            stream.id,
            { query: { $select: 'object', $embed: 'text' }, ...params },
          );
          expect(res.name).toBe(streamName);
          expect(res.config).toEqual(YAML.parse(configFileV2()));
        });

        it('attachments', async () => {
          expect.assertions(2);
          const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
          expect(res.name).toBe(streamName);
          expect(res.attachments).toHaveLength(0);
        });

        it('secrets', async () => {
          expect.assertions(2);
          const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
          expect(res.name).toBe(streamName);
          expect(res.secrets).toMatchObject([
            { target: encryptKeyTarget, ids: [{ version: 1, id: toVid(ekey1) }] },
          ]);
        });
      });

      describe('有効フラグがオフの場合', () => {
        it.each([
          ['default', {}],
          ['yaml', { $select: 'yaml' }],
        ])('yaml: %s', async (lbl, query) => {
          expect.assertions(2);
          const res = await service.get(
            stream.id,
            { query, ...params },
          );
          expect(res.name).toBe(streamName);
          const v2 = configFileV2();
          if (configFile === v2) {
            expect(res.yaml?.trim()).toBe(configFile);
          } else if (res.yaml != null) {
            expect(YAML.parse(res.yaml)).toEqual(YAML.parse(v2));
          }
        });

        it('config', async () => {
          expect.assertions(2);
          const res = await service.get(
            stream.id,
            { query: { $select: 'object', $embed: 'text' }, ...params },
          );
          expect(res.name).toBe(streamName);
          expect(res.config).toEqual(YAML.parse(configFileV2()));
        });

        it('attachments', async () => {
          expect.assertions(2);
          const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
          expect(res.name).toBe(streamName);
          expect(res.attachments).toHaveLength(0);
        });

        it('secrets', async () => {
          expect.assertions(2);
          const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
          expect(res.name).toBe(streamName);
          expect(res.secrets).toHaveLength(0);
        });

        beforeEach(async () => {
          await app.service('encrypt-keys').patch(ekey1.id, { enabled: false }, { ...params0 });
        });
      });

      beforeEach(async () => {
        await db('public_keys').del();
        await db('streams').del();
        stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
        await app.service('members').create({ user_id: user1.id, stream_id: stream.id }, { ...params0 });
        ekey1 = await app.service('encrypt-keys').create(
          {
            size: 256,
            target: encryptKeyTarget,
            key: encryptKey1,
            stream_id: stream.id,
            enabled: true,
          },
          { ...params0 },
        );
        params = { ...params0 };
      });
    });

    describe('添付ファイル', () => {
      let attachFile: AttachFiles;
      const configFile = configFileV2();
      const toVid = (afile: AttachFiles) => (toAfileVid(afile).split('.').slice(-2).join('-'));

      describe('有効フラグオン', () => {
        it.each([
          ['default', {}],
          ['yaml', { $select: 'yaml' }],
        ])('%s', async (lbl, query) => {
          expect.assertions(6);
          const res = await service.get(
            stream.id,
            { query, ...params },
          );
          expect(res.name).toBe(streamName);
          expect(res?.yaml?.startsWith('# 警告: ')).toBeTruthy();
          const obj0 = YAML.parse(configFileV2());
          if (res.yaml != null) {
            const obj = YAML.parse(res.yaml, { customTags: [binaryTag, sinetstreamEncrypt] });
            expect(obj).toMatchObject(obj0);
            expect(obj.header.fingerprint).toBeUndefined();
            [sname1, sname2].forEach((sname) => {
              expect(obj.config[sname].tls).toBeUndefined();
            });
          }
        });

        it('config', async () => {
          expect.assertions(2);
          const res = await service.get(
            stream.id,
            { query: { $select: 'object', $embed: 'text' }, ...params },
          );
          expect(res.name).toBe(streamName);
          expect(res.config).toEqual(YAML.parse(configFileV2()));
        });

        it('attachments', async () => {
          expect.assertions(2);
          const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
          expect(res.name).toBe(streamName);
          expect(res.attachments).toHaveLength(0);
        });

        it('secrets', async () => {
          expect.assertions(2);
          const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
          expect(res.name).toBe(streamName);
          expect(res.secrets).toMatchObject([
            { target: attachFileTarget, id: toVid(attachFile) },
          ]);
        });
      });

      describe('有効フラグオフ', () => {
        it.each([
          ['default', {}],
          ['yaml', { $select: 'yaml' }],
        ])('%s', async (lbl, query) => {
          expect.assertions(2);
          const res = await service.get(
            stream.id,
            { query, ...params },
          );
          expect(res.name).toBe(streamName);
          expect(res.yaml?.trim()).toBe(configFile);
        });

        it('config', async () => {
          expect.assertions(2);
          const res = await service.get(
            stream.id,
            { query: { $select: 'object', $embed: 'text' }, ...params },
          );
          expect(res.name).toBe(streamName);
          expect(res.config).toEqual(YAML.parse(configFile));
        });

        it('attachments', async () => {
          expect.assertions(2);
          const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
          expect(res.name).toBe(streamName);
          expect(res.attachments).toHaveLength(0);
        });

        it('secrets', async () => {
          expect.assertions(2);
          const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
          expect(res.name).toBe(streamName);
          expect(res.secrets).toHaveLength(0);
        });

        beforeEach(async () => {
          await app.service('attach-files').patch(
            attachFile.id,
            { enabled: false },
            { ...params0 },
          );
        });
      });

      beforeEach(async () => {
        await db('public_keys').del();
        await db('streams').del();
        stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
        await app.service('members').create({ user_id: user1.id, stream_id: stream.id }, { ...params0 });
        params = { ...params0 };
        attachFile = await app.service('attach-files').create({
          content: attachFileContent,
          target: attachFileTarget,
          stream_id: stream.id,
          enabled: true,
          secret: true,
        }, { ...params0 });
      });
    });

    describe('ユーザパラメータ', () => {
      const configFile = configFileV2();
      let uParam: UserParameters;
      const toVid = (up: UserParameters) => {
        const vid = toUParamVid(up).split('.').slice(-3);
        return `${vid[0]}-${vid[2]}`;
      };

      describe('秘匿情報でないバイナリ値', () => {
        describe('有効フラグオン', () => {
          it.each([
            ['default', {}],
            ['yaml', { $select: 'yaml' }],
          ])('%s', async (lbl, query) => {
            expect.assertions(4);
            const res = await service.get(
              stream.id,
              { query, ...params },
            );
            expect(res.name).toBe(streamName);
            const obj0 = YAML.parse(configFileV2());
            if (res.yaml != null) {
              const obj = YAML.parse(res.yaml);
              expect(obj).toMatchObject(obj0);
              [sname1, sname2].forEach((sname) => {
                expect(
                  obj.config[sname].sasl_plain_username.toString('base64'),
                ).toBe(userParameterBinaryValue);
              });
            }
          });

          it('config', async () => {
            expect.assertions(2);
            const res = await service.get(
              stream.id,
              { query: { $select: 'object', $embed: 'text' }, ...params },
            );
            expect(res.name).toBe(streamName);
            expect(res.config).toEqual(YAML.parse(configFileV2()));
          });

          it('attachments', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.attachments).toMatchObject([
              {
                target: userParameterTarget1,
                value: userParameterBinaryValue,
              },
            ]);
          });

          it('secrets', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.secrets).toHaveLength(0);
          });
        });

        describe('有効フラグオフ', () => {
          it.each([
            ['default', {}],
            ['yaml', { $select: 'yaml' }],
          ])('%s', async (lbl, query) => {
            expect.assertions(2);
            const res = await service.get(
              stream.id,
              { query, ...params },
            );
            expect(res.name).toBe(streamName);
            expect(res.yaml?.trim()).toBe(configFile);
          });

          it('config', async () => {
            expect.assertions(2);
            const res = await service.get(
              stream.id,
              { query: { $select: 'object', $embed: 'text' }, ...params },
            );
            expect(res.name).toBe(streamName);
            expect(res.config).toEqual(YAML.parse(configFile));
          });

          it('attachments', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.attachments).toHaveLength(0);
          });

          it('secrets', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.secrets).toHaveLength(0);
          });

          beforeEach(async () => {
            await app.service('user-parameters').patch(
              uParam.id,
              { enabled: false },
              { ...params0 },
            );
          });
        });

        beforeEach(async () => {
          uParam = await app.service('user-parameters').create({
            content: userParameterBinaryValue,
            target: userParameterTarget1,
            stream_id: stream.id,
            user_id: user.id,
            enabled: true,
            secret: false,
          }, { ...params0 });
        });
      });

      describe('秘匿情報のバイナリ値', () => {
        describe('有効フラグオン', () => {
          it.each([
            ['default', {}],
            ['yaml', { $select: 'yaml' }],
          ])('yaml: %s', async (lbl, query) => {
            expect.assertions(6);
            const res = await service.get(
              stream.id,
              { query, ...params },
            );
            expect(res.name).toBe(streamName);
            expect(res?.yaml?.startsWith('# 警告: ')).toBeTruthy();
            const obj0 = YAML.parse(configFileV2());
            if (res.yaml != null) {
              const obj = YAML.parse(res.yaml, { customTags: [sinetstreamEncrypt] });
              expect(obj).toMatchObject(obj0);
              expect(obj.header.fingerprint).toBeUndefined();
              [sname1, sname2].forEach((sname) => {
                expect(obj.config[sname].sasl_plain_password).toBeUndefined();
              });
            }
          });

          it('config', async () => {
            expect.assertions(2);
            const res = await service.get(
              stream.id,
              { query: { $select: 'object', $embed: 'text' }, ...params },
            );
            expect(res.name).toBe(streamName);
            expect(res.config).toEqual(YAML.parse(configFileV2()));
          });

          it('attachments', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.attachments).toHaveLength(0);
          });

          it('secrets', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.secrets).toMatchObject([
              { target: userParameterTarget2, id: toVid(uParam) },
            ]);
          });
        });

        describe('有効フラグオフ', () => {
          it.each([
            ['default', {}],
            ['yaml', { $select: 'yaml' }],
          ])('%s', async (lbl, query) => {
            expect.assertions(2);
            const res = await service.get(
              stream.id,
              { query, ...params },
            );
            expect(res.name).toBe(streamName);
            expect(res.yaml?.trim()).toBe(configFile);
          });

          it('config', async () => {
            expect.assertions(2);
            const res = await service.get(
              stream.id,
              { query: { $select: 'object', $embed: 'text' }, ...params },
            );
            expect(res.name).toBe(streamName);
            expect(res.config).toEqual(YAML.parse(configFile));
          });

          it('attachments', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'attachments' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.attachments).toHaveLength(0);
          });

          it('secrets', async () => {
            expect.assertions(2);
            const res = await service.get(stream.id, { query: { $select: 'secrets' }, ...params });
            expect(res.name).toBe(streamName);
            expect(res.secrets).toHaveLength(0);
          });

          beforeEach(async () => {
            await app.service('user-parameters').patch(
              uParam.id,
              { enabled: false },
              { ...params0 },
            );
          });
        });

        beforeEach(async () => {
          uParam = await app.service('user-parameters').create({
            content: userParameterBinaryValue,
            target: userParameterTarget2,
            stream_id: stream.id,
            user_id: user.id,
            enabled: true,
            secret: true,
          }, { ...params0 });
        });
      });

      beforeEach(async () => {
        await db('public_keys').del();
        await db('streams').del();
        stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
        await app.service('members').create({ user_id: user1.id, stream_id: stream.id }, { ...params0 });
        params = { ...params0 };
      });
    });
  });

  describe('異常系', () => {
    describe('設定ファイルが登録されていない場合', () => {
      it.each([
        ['default', {}],
        ['default', { $select: 'yaml' }],
        ['config', { $select: 'object' }],
        ['attachments', { $select: 'attachments' }],
        ['secrets', { $select: 'secrets' }],
      ])('query: %s', async (lbl, query) => {
        await expect(async () => {
          await service.get(1, { query, ...params });
        }).rejects.toThrowError(NotFound);
      });

      beforeEach(async () => {
        await db('streams').del();
        params = { ...params0 };
      });
    });

    describe('設定ファイルが空の場合', () => {
      it.each([
        ['default', {}],
        ['yaml', { $select: 'yaml' }],
      ])('yaml: %s', async (lbl, query) => {
        const res = await service.get(
          stream.id,
          { query, ...params },
        );
        expect(res).toMatchObject({
          name: streamName,
          yaml: '',
        });
      });

      it('config', async () => {
        const query = { $select: 'object', $embed: 'text' };
        const res = await service.get(
          stream.id,
          { query, ...params },
        );
        expect(res).toMatchObject({
          name: streamName,
          config: {},
        });
      });

      it('attachments', async () => {
        const res = await service.get(
          stream.id,
          { query: { $select: 'attachments' }, ...params },
        );
        expect(res.name).toBe(streamName);
        expect(res.attachments).toHaveLength(0);
      });

      it('secrets', async () => {
        const res = await service.get(
          stream.id,
          { query: { $select: 'secrets' }, ...params },
        );
        expect(res.name).toBe(streamName);
        expect(res.secrets).toHaveLength(0);
      });

      beforeEach(async () => {
        await db('streams').del();
        stream = await app.service('streams').create({ name: streamName }, { ...params0 });
        params = { ...params0 };
      });
    });

    describe('設定ファイルフォーマットがサポート対象外(ver.3以上)', () => {
      const configFile = configFileV2(topic1, topic2, 3);
      let ekey1: EncryptKeys;
      const toVid = (ekey: EncryptKeys) => (toEkeyVid(ekey).split('.').slice(-2).join('-'));

      it.each([
        ['default', {}],
        ['yaml', { $select: 'yaml' }],
      ])('yaml: %s', async (lbl, query) => {
        const res = await service.get(
          stream.id,
          { query, ...params },
        );
        expect(res.name).toBe(streamName);
        const obj0 = YAML.parse(configFile);
        if (res.yaml != null) {
          const obj = YAML.parse(res.yaml, { customTags: [sinetstreamEncrypt] });
          expect(obj).toMatchObject(obj0);
          expect(obj.header.fingerprint).toBe(fingerprint);
          [sname1, sname2].forEach((sname) => {
            const sec: SecretData = obj.config[sname].crypto.key;
            expect(sec.decrypt(privKey).toString('base64')).toBe(encryptKey1);
          });
        }
      });

      it('config', async () => {
        const query = { $select: 'object', $embed: 'text' };
        const res = await service.get(
          stream.id,
          { query, ...params },
        );
        expect(res.name).toBe(streamName);
        expect(res.config).toEqual(YAML.parse(configFile));
      });

      it('attachments', async () => {
        const res = await service.get(
          stream.id,
          { query: { $select: 'attachments' }, ...params },
        );
        expect(res.name).toBe(streamName);
        expect(res.attachments).toHaveLength(0);
      });

      it('secrets', async () => {
        const res = await service.get(
          stream.id,
          { query: { $select: 'secrets' }, ...params },
        );
        expect(res.name).toBe(streamName);
        expect(res.secrets).toMatchObject([
          { target: encryptKeyTarget, ids: [{ version: 1, id: toVid(ekey1) }] },
        ]);
      });

      beforeEach(async () => {
        await db('public_keys').del();
        await db('streams').del();
        stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
        ekey1 = await app.service('encrypt-keys').create(
          {
            size: 256,
            target: encryptKeyTarget,
            key: encryptKey1,
            stream_id: stream.id,
            enabled: true,
          },
          { ...params0 },
        );
        const ret = await app.service('public-keys').create({
          defaultKey: true,
          publicKey: pubKey.export({ type: 'pkcs1', format: 'pem' }),
        }, { ...params0 });
        fingerprint = ret.fingerprint;
        params = { ...params0 };
      });
    });

    describe('登録されている設定ファイルが不正なフォーマット', () => {
      const configFile = configFileX();

      it.each([
        ['default', {}],
        ['yaml', { $select: 'yaml' }],
      ])('yaml: %s', async (lbl, query) => {
        const res = await service.get(
          stream.id,
          { query, ...params },
        );
        expect(res.name).toBe(streamName);
        expect(res?.yaml?.startsWith('# ERROR')).toBeTruthy();
      });

      it.each(['object', 'attachments', 'secrets'])('prop: %s', async (prop) => {
        const query = { $select: prop };
        await expect(async () => {
          await service.get(
            stream.id,
            { query, ...params },
          );
        }).rejects.toThrowError(BadRequest);
      });

      beforeEach(async () => {
        await db('public_keys').del();
        await db('streams').del();
        stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
        await app.service('encrypt-keys').create(
          {
            size: 256,
            target: encryptKeyTarget,
            key: encryptKey1,
            stream_id: stream.id,
            enabled: true,
          },
          { ...params0 },
        );
        const ret = await app.service('public-keys').create({
          defaultKey: true,
          publicKey: pubKey.export({ type: 'pkcs1', format: 'pem' }),
        }, { ...params0 });
        fingerprint = ret.fingerprint;
        params = { ...params0 };
      });
    });

    describe('埋め込み先の途中のノードに Map 以外の値が設定されていた場合', () => {
      const configFile = configFileV2();

      it.each([
        ['default', {}],
        ['yaml', { $select: 'yaml' }],
      ])('yaml: %s', async (lbl, query) => {
        const res = await service.get(
          stream.id,
          { query, ...params },
        );
        expect(res.name).toBe(streamName);
        expect(res?.yaml?.toUpperCase()?.startsWith('# ERROR')).toBeTruthy();
      });

      it.each(['object', 'attachments', 'secrets'])('prop: %s', async (prop) => {
        const query = { $select: prop };
        await expect(async () => {
          await service.get(
            stream.id,
            { query, ...params },
          );
        }).rejects.toThrowError(BadFileFormat);
      });

      beforeEach(async () => {
        await db('public_keys').del();
        await db('streams').del();
        stream = await app.service('streams').create({ name: streamName, configFile }, { ...params0 });
        await app.service('encrypt-keys').create(
          {
            size: 256,
            target: targetX,
            key: encryptKey1,
            stream_id: stream.id,
            enabled: true,
          },
          { ...params0 },
        );
        const ret = await app.service('public-keys').create({
          defaultKey: true,
          publicKey: pubKey.export({ type: 'pkcs1', format: 'pem' }),
        }, { ...params0 });
        fingerprint = ret.fingerprint;
        params = { ...params0 };
      });
    });
  });

  const adminInfo = {
    name: 'admin',
    systemAdmin: true,
  };

  beforeAll(async () => {
    db = app.get('knex');
    await db('users').insert(adminInfo);
    const userService = app.service('users');
    const [admin] = ((await userService.find({ query: { name: adminInfo.name } })) as Users[]);
    user = await userService.create(user0Info, { user: admin });
    user1 = await userService.create(user1Info, { user: admin });
    otherUser = await userService.create(otherUserInfo, { user: admin });
    const authentication = await getAuthentication(user0Info);
    params0 = { user, authentication, test: { jest: true } };

    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    pubKey = publicKey;
    privKey = privateKey;
  });

  afterAll(async () => {
    await db('public_keys').del();
    await db('members').del();
    await db('streams').del();
    await db('users').del();
  });
});
