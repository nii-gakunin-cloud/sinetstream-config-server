/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import {
  BadRequest, Forbidden, MethodNotAllowed, NotFound,
} from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { randomBytes } from 'crypto';
import { Knex } from 'knex';
import app from '../../src/app';
import { toVid } from '../../src/hooks/process-encrypt-keys';
import { EncryptKeys } from '../../src/models/encrypt-keys.model';
import { Streams } from '../../src/models/streams.model';
import { Users } from '../../src/models/users.model';

describe('\'encrypt-keys\' service', () => {
  let db: Knex;
  const service = app.service('encrypt-keys');
  const vault = app.service('vault');
  let user: Users;
  let user1: Users;
  let otherUser: Users;
  let stream: Streams;
  let params: Params;
  let params1: Params;
  let params2: Params;
  const target = '*.crypto.key';
  const comment = 'comment';
  const streamName = 'config-001';
  const streamComment = 'config-001 comment';
  let authentication: Record<string, any>;
  let authentication1: Record<string, any>;
  let authentication2: Record<string, any>;

  describe('データ暗号鍵を登録する', () => {
    describe.each([128, 192, 256])('新規の鍵を登録する: size=%i', (size) => {
      it('サーバ側で暗号鍵を生成する場合', async () => {
        expect.assertions(16);
        const key = await service.create({
          size,
          target,
          comment,
          stream_id: stream.id,
          enabled: true,
        }, { ...params });
        expect(key.id).not.toBeNull();
        expect(key.stream_id).toBe(stream.id);
        expect(key.target).toBe(target);
        expect(key.version).toBe(1);
        expect(key.enabled).toBe(true);
        expect(key.size).toBe(size);
        expect(key.comment).toBe(comment);
        expect(key.createdAt).not.toBeNull();
        expect(key.updatedAt).not.toBeNull();
        expect(key.createdUser).toBe(user.id);
        expect(key.updatedUser).toBe(user.id);

        // HashiCorp Vaultに暗号鍵が登録されていることを確認する
        const secret = await vault.get(toVid(key), { ...params });
        expect(secret.size).toBe(size);
        expect(secret.target).toBe(target);
        expect(secret.version).toBe(1);
        expect(secret.value).not.toBeNull();
        const encryptKey = Buffer.from(secret.value, 'base64');
        expect(encryptKey.length * 8).toBe(size);
      });

      it('クライアント側で暗号鍵を指定する場合', async () => {
        expect.assertions(15);
        const buf = randomBytes(size / 8);
        const encryptKey = buf.toString('base64');
        const key = await service.create({
          key: encryptKey,
          size,
          target,
          comment,
          stream_id: stream.id,
          enabled: true,
        }, { ...params });
        expect(key.id).not.toBeNull();
        expect(key.stream_id).toBe(stream.id);
        expect(key.target).toBe(target);
        expect(key.version).toBe(1);
        expect(key.enabled).toBe(true);
        expect(key.size).toBe(size);
        expect(key.comment).toBe(comment);
        expect(key.createdAt).not.toBeNull();
        expect(key.updatedAt).not.toBeNull();
        expect(key.createdUser).toBe(user.id);
        expect(key.updatedUser).toBe(user.id);

        // HashiCorp Vaultに暗号鍵が登録されていることを確認する
        const secret = await vault.get(toVid(key), { ...params });
        expect(secret.size).toBe(size);
        expect(secret.target).toBe(target);
        expect(secret.version).toBe(1);
        expect(secret.value).toBe(encryptKey);
      });

      it('クライアント側で暗号鍵を指定する場合: サイズ指定が文字列', async () => {
        expect.assertions(15);
        const buf = randomBytes(size / 8);
        const encryptKey = buf.toString('base64');
        const key = await service.create({
          key: encryptKey,
          size: size.toString(),
          target,
          comment,
          stream_id: stream.id,
          enabled: true,
        }, params);
        expect(key.id).not.toBeNull();
        expect(key.stream_id).toBe(stream.id);
        expect(key.target).toBe(target);
        expect(key.version).toBe(1);
        expect(key.enabled).toBe(true);
        expect(Number(key.size)).toBe(size);
        expect(key.comment).toBe(comment);
        expect(key.createdAt).not.toBeNull();
        expect(key.updatedAt).not.toBeNull();
        expect(key.createdUser).toBe(user.id);
        expect(key.updatedUser).toBe(user.id);

        // HashiCorp Vaultに暗号鍵が登録されていることを確認する
        const secret = await vault.get(toVid(key), { ...params });
        expect(Number(secret.size)).toBe(size);
        expect(secret.target).toBe(target);
        expect(secret.version).toBe(1);
        expect(secret.value).toBe(encryptKey);
      });

      describe('有効フラグ', () => {
        it('フラグoff', async () => {
          expect.assertions(16);
          const key = await service.create({
            size,
            target,
            comment,
            stream_id: stream.id,
            enabled: false,
          }, { ...params });
          expect(key.id).not.toBeNull();
          expect(key.stream_id).toBe(stream.id);
          expect(key.target).toBe(target);
          expect(key.version).toBe(1);
          expect(key.enabled).toBe(false);
          expect(key.size).toBe(size);
          expect(key.comment).toBe(comment);
          expect(key.createdAt).not.toBeNull();
          expect(key.updatedAt).not.toBeNull();
          expect(key.createdUser).toBe(user.id);
          expect(key.updatedUser).toBe(user.id);

          // HashiCorp Vaultに暗号鍵が登録されていることを確認する
          const secret = await vault.get(toVid(key), { ...params });
          expect(secret.size).toBe(size);
          expect(secret.target).toBe(target);
          expect(secret.version).toBe(1);
          expect(secret.value).not.toBeNull();
          const encryptKey = Buffer.from(secret.value, 'base64');
          expect(encryptKey.length * 8).toBe(size);
        });

        it('デフォルト指定', async () => {
          expect.assertions(16);
          const key = await service.create({
            size,
            target,
            stream_id: stream.id,
          }, { ...params });
          expect(key.id).not.toBeNull();
          expect(key.stream_id).toBe(stream.id);
          expect(key.target).toBe(target);
          expect(key.version).toBe(1);
          expect(key.enabled).toBe(true);
          expect(key.size).toBe(size);
          expect(key.comment).toBeNull();
          expect(key.createdAt).not.toBeNull();
          expect(key.updatedAt).not.toBeNull();
          expect(key.createdUser).toBe(user.id);
          expect(key.updatedUser).toBe(user.id);

          // HashiCorp Vaultに暗号鍵が登録されていることを確認する
          const secret = await vault.get(toVid(key), { ...params });
          expect(secret.size).toBe(size);
          expect(secret.target).toBe(target);
          expect(secret.version).toBe(1);
          expect(secret.value).not.toBeNull();
          const encryptKey = Buffer.from(secret.value, 'base64');
          expect(encryptKey.length * 8).toBe(size);
        });
      });
    });

    describe.each([128, 192, 256])('暗号鍵の更新: size=%i', (size) => {
      let key0: EncryptKeys;

      describe.each([128, 192, 256])('鍵サイズ: new size=%i', (newSize) => {
        it('サーバ側で暗号鍵を生成する場合', async () => {
          expect.assertions(18);
          const key = await service.create({
            size: newSize,
            target,
            comment,
            stream_id: stream.id,
            enabled: true,
          }, { ...params });
          expect(key.id).not.toBe(key0.id);
          expect(key.stream_id).toBe(stream.id);
          expect(key.target).toBe(target);
          expect(key.version).toBe(2);
          expect(key.enabled).toBe(true);
          expect(key.size).toBe(newSize);
          expect(key.comment).toBe(comment);
          expect(key.createdAt).not.toBeNull();
          expect(key.updatedAt).not.toBeNull();
          expect(key.createdUser).toBe(user.id);
          expect(key.updatedUser).toBe(user.id);

          // HashiCorp Vaultに暗号鍵が登録されていることを確認する
          const secret = await vault.get(toVid(key), { ...params });
          expect(secret.size).toBe(newSize);
          expect(secret.target).toBe(target);
          expect(secret.version).toBe(2);
          expect(secret.value).not.toBeNull();
          const encryptKey = Buffer.from(secret.value, 'base64');
          expect(encryptKey.length * 8).toBe(newSize);

          // 古い暗号鍵の有効フラグがオフになること
          const key1 = await service.get(key0.id, { ...params });
          expect(key1.version).toBe(1);
          expect(key1.enabled).toBe(false);
        });

        it('クライアント側で暗号鍵を指定する場合', async () => {
          expect.assertions(17);
          const buf = randomBytes(newSize / 8);
          const encryptKey = buf.toString('base64');
          const key = await service.create({
            key: encryptKey,
            size: newSize,
            target,
            comment,
            stream_id: stream.id,
            enabled: true,
          }, { ...params });
          expect(key.id).not.toBe(key0.id);
          expect(key.stream_id).toBe(stream.id);
          expect(key.target).toBe(target);
          expect(key.version).toBe(2);
          expect(key.enabled).toBe(true);
          expect(key.size).toBe(newSize);
          expect(key.comment).toBe(comment);
          expect(key.createdAt).not.toBeNull();
          expect(key.updatedAt).not.toBeNull();
          expect(key.createdUser).toBe(user.id);
          expect(key.updatedUser).toBe(user.id);

          // HashiCorp Vaultに暗号鍵が登録されていることを確認する
          const secret = await vault.get(toVid(key), { ...params });
          expect(secret.size).toBe(newSize);
          expect(secret.target).toBe(target);
          expect(secret.version).toBe(2);
          expect(secret.value).toBe(encryptKey);

          // 古い暗号鍵の有効フラグがオフになること
          const key1 = await service.get(key0.id, { ...params });
          expect(key1.version).toBe(1);
          expect(key1.enabled).toBe(false);
        });
      });

      describe('有効フラグ', () => {
        it('フラグoff', async () => {
          expect.assertions(16);
          const key = await service.create({
            size,
            target,
            comment,
            stream_id: stream.id,
            enabled: false,
          }, { ...params });
          expect(key.id).not.toBe(key0.id);
          expect(key.stream_id).toBe(stream.id);
          expect(key.target).toBe(target);
          expect(key.version).toBe(2);
          expect(key.enabled).toBe(false);
          expect(key.size).toBe(size);
          expect(key.comment).toBe(comment);
          expect(key.createdAt).not.toBeNull();
          expect(key.updatedAt).not.toBeNull();
          expect(key.createdUser).toBe(user.id);
          expect(key.updatedUser).toBe(user.id);

          // HashiCorp Vaultに暗号鍵が登録されていることを確認する
          const secret = await vault.get(toVid(key), { ...params });
          expect(secret.size).toBe(size);
          expect(secret.target).toBe(target);
          expect(secret.version).toBe(2);
          expect(secret.value).not.toBeNull();
          const encryptKey = Buffer.from(secret.value, 'base64');
          expect(encryptKey.length * 8).toBe(size);
        });

        it('デフォルト指定', async () => {
          expect.assertions(16);
          const key = await service.create({
            size,
            target,
            stream_id: stream.id,
          }, { ...params });
          expect(key.id).not.toBe(key0.id);
          expect(key.stream_id).toBe(stream.id);
          expect(key.target).toBe(target);
          expect(key.version).toBe(2);
          expect(key.enabled).toBe(true);
          expect(key.size).toBe(size);
          expect(key.comment).toBeNull();
          expect(key.createdAt).not.toBeNull();
          expect(key.updatedAt).not.toBeNull();
          expect(key.createdUser).toBe(user.id);
          expect(key.updatedUser).toBe(user.id);

          // HashiCorp Vaultに暗号鍵が登録されていることを確認する
          const secret = await vault.get(toVid(key), { ...params });
          expect(secret.size).toBe(size);
          expect(secret.target).toBe(target);
          expect(secret.version).toBe(2);
          expect(secret.value).not.toBeNull();
          const encryptKey = Buffer.from(secret.value, 'base64');
          expect(encryptKey.length * 8).toBe(size);
        });
      });

      describe('異なるtargetを指定すると新規登録となること', () => {
        const newTarget = 'service-1.crypto.key';

        it('サーバ側で暗号鍵を生成する場合', async () => {
          expect.assertions(16);
          const key = await service.create({
            size,
            target: newTarget,
            comment,
            stream_id: stream.id,
          }, { ...params });
          expect(key.id).not.toBeNull();
          expect(key.stream_id).toBe(stream.id);
          expect(key.target).toBe(newTarget);
          expect(key.version).toBe(1);
          expect(key.enabled).toBe(true);
          expect(key.size).toBe(size);
          expect(key.comment).toBe(comment);
          expect(key.createdAt).not.toBeNull();
          expect(key.updatedAt).not.toBeNull();
          expect(key.createdUser).toBe(user.id);
          expect(key.updatedUser).toBe(user.id);

          // HashiCorp Vaultに暗号鍵が登録されていることを確認する
          const secret = await vault.get(toVid(key), { ...params });
          expect(secret.size).toBe(size);
          expect(secret.target).toBe(newTarget);
          expect(secret.version).toBe(1);
          expect(secret.value).not.toBeNull();
          const encryptKey = Buffer.from(secret.value, 'base64');
          expect(encryptKey.length * 8).toBe(size);
        });

        it('クライアント側で暗号鍵を指定する場合', async () => {
          expect.assertions(15);
          const buf = randomBytes(size / 8);
          const encryptKey = buf.toString('base64');
          const key = await service.create({
            key: encryptKey,
            size,
            target: newTarget,
            comment,
            stream_id: stream.id,
          }, { ...params });
          expect(key.id).not.toBeNull();
          expect(key.stream_id).toBe(stream.id);
          expect(key.target).toBe(newTarget);
          expect(key.version).toBe(1);
          expect(key.enabled).toBe(true);
          expect(key.size).toBe(size);
          expect(key.comment).toBe(comment);
          expect(key.createdAt).not.toBeNull();
          expect(key.updatedAt).not.toBeNull();
          expect(key.createdUser).toBe(user.id);
          expect(key.updatedUser).toBe(user.id);

          // HashiCorp Vaultに暗号鍵が登録されていることを確認する
          const secret = await vault.get(toVid(key), { ...params });
          expect(secret.size).toBe(size);
          expect(secret.target).toBe(newTarget);
          expect(secret.version).toBe(1);
          expect(secret.value).toBe(encryptKey);
        });
      });

      beforeEach(async () => {
        key0 = await service.create({
          size,
          target,
          comment,
          stream_id: stream.id,
          enabled: true,
        }, { ...params });
      });
    });

    describe.each([3, 4, 5])('複数回の暗号鍵更新: count=%i', (version) => {
      const size = 256;

      it('サーバ側で暗号鍵を生成する場合', async () => {
        expect.assertions(15 + (version - 1) * 3);
        const key = await service.create({
          size,
          target,
          comment,
          stream_id: stream.id,
          enabled: true,
        }, { ...params });
        expect(key.stream_id).toBe(stream.id);
        expect(key.target).toBe(target);
        expect(key.version).toBe(version);
        expect(key.enabled).toBe(true);
        expect(key.size).toBe(size);
        expect(key.comment).toBe(comment);
        expect(key.createdAt).not.toBeNull();
        expect(key.updatedAt).not.toBeNull();
        expect(key.createdUser).toBe(user.id);
        expect(key.updatedUser).toBe(user.id);

        // HashiCorp Vaultに暗号鍵が登録されていることを確認する
        const secret = await vault.get(toVid(key), { ...params });
        expect(secret.size).toBe(size);
        expect(secret.target).toBe(target);
        expect(secret.version).toBe(version);
        expect(secret.value).not.toBeNull();
        const encryptKey = Buffer.from(secret.value, 'base64');
        expect(encryptKey.length * 8).toBe(size);

        // 古い暗号鍵の有効フラグがオフになること
        const versions = Array.from({ length: version - 1 }, (_, i) => 1 + i);
        await Promise.all(versions.map(async (v) => {
          const res = await service.find({
            query: {
              version: v,
              target,
              stream_id: stream.id,
            },
            ...params,
          });
          if (res instanceof Array) {
            expect(res.length).toBe(1);
            expect(res[0].version).toBe(v);
            expect(res[0].enabled).toBe(false);
          }
          return res;
        }));
      });

      it('クライアント側で暗号鍵を指定する場合', async () => {
        expect.assertions(14 + (version - 1) * 3);
        const buf = randomBytes(size / 8);
        const encryptKey = buf.toString('base64');
        const key = await service.create({
          key: encryptKey,
          size,
          target,
          comment,
          stream_id: stream.id,
          enabled: true,
        }, { ...params });
        expect(key.stream_id).toBe(stream.id);
        expect(key.target).toBe(target);
        expect(key.version).toBe(version);
        expect(key.enabled).toBe(true);
        expect(key.size).toBe(size);
        expect(key.comment).toBe(comment);
        expect(key.createdAt).not.toBeNull();
        expect(key.updatedAt).not.toBeNull();
        expect(key.createdUser).toBe(user.id);
        expect(key.updatedUser).toBe(user.id);

        // HashiCorp Vaultに暗号鍵が登録されていることを確認する
        const secret = await vault.get(toVid(key), { ...params });
        expect(secret.size).toBe(size);
        expect(secret.target).toBe(target);
        expect(secret.version).toBe(version);
        expect(secret.value).toBe(encryptKey);

        // 古い暗号鍵の有効フラグがオフになること
        const versions = Array.from({ length: version - 1 }, (_, i) => 1 + i);
        await Promise.all(versions.map(async (v) => {
          const res = await service.find({
            query: {
              version: v,
              target,
              stream_id: stream.id,
            },
            ...params,
          });
          if (res instanceof Array) {
            expect(res.length).toBe(1);
            expect(res[0].version).toBe(v);
            expect(res[0].enabled).toBe(false);
          }
          return res;
        }));
      });

      beforeEach(async () => {
        // eslint-disable-next-line no-restricted-syntax
        for await (const _ of Array(version - 1)) {
          await service.create(
            { size, target, stream_id: stream.id },
            { ...params },
          );
        }
      });
    });

    describe('異常系', () => {
      describe('必須項目が指定されていない', () => {
        it('stream_id', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              size: 256,
              target,
              comment,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('target', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              size: 256,
              comment,
              stream_id: stream.id,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });

        describe('size', () => {
          it('サーバ側で暗号鍵を生成する場合', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create({
                target,
                comment,
                stream_id: stream.id,
              }, params);
            }).rejects.toThrowError(BadRequest);
          });

          it('クライアント側で暗号鍵を指定する場合', async () => {
            const size = 256;
            expect.assertions(1);
            const buf = randomBytes(size / 8);
            const encryptKey = buf.toString('base64');
            await expect(async () => {
              await service.create({
                key: encryptKey,
                target,
                comment,
                stream_id: stream.id,
              }, params);
            }).rejects.toThrowError(BadRequest);
          });
        });
      });

      describe('妥当でないパラメータの指定', () => {
        describe('鍵サイズ', () => {
          it('size=129', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create({
                size: 129,
                target,
                comment,
                stream_id: stream.id,
              }, params);
            }).rejects.toThrowError(BadRequest);
          });

          it('size=512', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create({
                size: 512,
                target,
                comment,
                stream_id: stream.id,
              }, params);
            }).rejects.toThrowError(BadRequest);
          });
        });

        it('サイズ指定が実際の鍵サイズと一致しない', async () => {
          expect.assertions(1);
          const size = 256;
          const buf = randomBytes(size / 8);
          const encryptKey = buf.toString('base64');
          await expect(async () => {
            await service.create({
              key: encryptKey,
              size: 128,
              target,
              comment,
              stream_id: stream.id,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('stream_id', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              size: 256,
              target,
              comment,
              stream_id: -1,
            }, params);
          }).rejects.toThrowError(Forbidden);
        });

        it.each([' ', '*', '*..xxx', '*.xxx.*.xxx'])('正しくない書式のtarget指定', async (tgt) => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              size: 256,
              target: tgt,
              comment,
              stream_id: stream.id,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });
      });
    });

    it('version指定が無視されること', async () => {
      expect.assertions(16);
      const size = 256;
      const key = await service.create({
        version: 10,
        size,
        target,
        comment,
        stream_id: stream.id,
        enabled: true,
      }, { ...params });
      expect(key.id).not.toBeNull();
      expect(key.stream_id).toBe(stream.id);
      expect(key.target).toBe(target);
      expect(key.version).toBe(1);
      expect(key.enabled).toBe(true);
      expect(key.size).toBe(size);
      expect(key.comment).toBe(comment);
      expect(key.createdAt).not.toBeNull();
      expect(key.updatedAt).not.toBeNull();
      expect(key.createdUser).toBe(user.id);
      expect(key.updatedUser).toBe(user.id);

      // HashiCorp Vaultに暗号鍵が登録されていることを確認する
      const secret = await vault.get(toVid(key), { ...params });
      expect(secret.size).toBe(size);
      expect(secret.target).toBe(target);
      expect(secret.version).toBe(1);
      expect(secret.value).not.toBeNull();
      const encryptKey = Buffer.from(secret.value, 'base64');
      expect(encryptKey.length * 8).toBe(size);
    });

    describe('権限のない利用者による登録', () => {
      describe('新規の鍵を登録する場合', () => {
        it('共同利用者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create(
              {
                size: 256,
                target,
                comment,
                stream_id: stream.id,
                enabled: true,
              },
              { ...params2 },
            );
          }).rejects.toThrowError(Forbidden);
        });

        it('データ管理者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create(
              {
                size: 256,
                target,
                comment,
                stream_id: stream.id,
                enabled: true,
              },
              { ...params1 },
            );
          }).rejects.toThrowError(Forbidden);
        });
      });
      describe('暗号鍵を更新する場合', () => {
        it('共同利用者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create(
              {
                size: 256,
                target,
                comment,
                stream_id: stream.id,
                enabled: true,
              },
              { ...params2 },
            );
          }).rejects.toThrowError(Forbidden);
        });

        it('データ管理者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create(
              {
                size: 256,
                target,
                comment,
                stream_id: stream.id,
                enabled: true,
              },
              { ...params1 },
            );
          }).rejects.toThrowError(Forbidden);
        });

        beforeEach(async () => {
          await service.create({
            size: 256,
            target,
            comment,
            stream_id: stream.id,
            enabled: true,
          }, { ...params });
        });
      });
    });
  });

  describe('データ暗号鍵情報を更新する', () => {
    let key0: EncryptKeys;

    it('コメントの変更', async () => {
      expect.assertions(3);
      const newComment = `new-${comment}`;
      const key = await service.patch(key0.id, { comment: newComment }, params);
      const { comment: _comment, updatedAt: updatedAt0, ...keyParams0 } = key0;
      const { comment: comment1, updatedAt: updatedAt1, ...keyParams1 } = key;
      expect(comment1).toBe(newComment);
      expect(updatedAt1).not.toEqual(updatedAt0);
      expect(keyParams1).toEqual(keyParams0);
    });

    describe.each([true, false])('有効フラグ: %p', (enabled) => {
      it('変更の実行', async () => {
        expect.assertions(4);
        const key = await service.patch(key0.id, { enabled }, params);
        const { enabled: enabled0, updatedAt: updatedAt0, ...keyParams0 } = key0;
        const { enabled: enabled1, updatedAt: updatedAt1, ...keyParams1 } = key;
        expect(enabled0).toBe(!enabled);
        expect(enabled1).toBe(enabled);
        expect(updatedAt1).not.toEqual(updatedAt0);
        expect(keyParams1).toEqual(keyParams0);
      });

      beforeEach(async () => {
        key0 = await service.create({
          size: 256,
          target,
          comment,
          stream_id: stream.id,
          enabled: !enabled,
        }, { ...params });
      });
    });

    describe('異常系', () => {
      describe('変更不可の項目', () => {
        describe('stream_id', () => {
          let stream1: Streams;

          it('変更の実行', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.patch(key0.id, { stream_id: stream1.id }, params);
            }).rejects.toThrowError(BadRequest);
          });

          beforeEach(async () => {
            const name = 'config-002';
            stream1 = await app.service('streams').create({ name }, { ...params });
          });
        });

        it('target', async () => {
          expect.assertions(1);
          await expect(async () => {
            const newTarget = `${target}.new`;
            await service.patch(key0.id, { target: newTarget }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('version', async () => {
          expect.assertions(1);
          const newVersion = 10;
          await expect(async () => {
            await service.patch(key0.id, { version: newVersion }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('size', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(key0.id, { size: 128 }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('key', async () => {
          expect.assertions(1);
          const size = 256;
          const buf = randomBytes(size / 8);
          const encryptKey = buf.toString('base64');
          await expect(async () => {
            await service.patch(key0.id, { key: encryptKey }, params);
          }).rejects.toThrowError(BadRequest);
        });
      });

      describe('古いバージョンのレコードを変更できないこと', () => {
        it('enabled', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(key0.id, { enabled: true }, params);
          }).rejects.toThrowError(MethodNotAllowed);
        });

        it('comment', async () => {
          expect.assertions(1);
          const newComment = `new-${comment}`;
          await expect(async () => {
            await service.patch(key0.id, { comment: newComment }, params);
          }).rejects.toThrowError(MethodNotAllowed);
        });

        beforeEach(async () => {
          await service.create({
            size: 256,
            target,
            comment,
            stream_id: stream.id,
            enabled: true,
          }, { ...params });
        });
      });

      describe('権限のない利用者による更新', () => {
        it('共同利用者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(
              key0.id,
              { enabled: false },
              { ...params2 },
            );
          }).rejects.toThrowError(Forbidden);
        });

        it('データ管理者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(
              key0.id,
              { enabled: false },
              { ...params1 },
            );
          }).rejects.toThrowError(Forbidden);
        });
      });

      it('PUTによる更新', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.update(
            key0.id,
            {
              size: 256,
              target,
              comment,
              stream_id: stream.id,
              enabled: true,
            },
            params,
          );
        }).rejects.toThrowError(MethodNotAllowed);
      });
    });

    beforeEach(async () => {
      key0 = await service.create({
        size: 256,
        target,
        comment,
        stream_id: stream.id,
        enabled: true,
      }, { ...params });
    });
  });

  describe('データ暗号鍵を削除する', () => {
    let key0: EncryptKeys;

    it('削除は許可されない', async () => {
      expect.assertions(1);
      await expect(async () => {
        await service.remove(key0.id, params);
      }).rejects.toThrowError(MethodNotAllowed);
    });

    describe('コンフィグ情報の削除にあわせて削除されること', () => {
      let stream1: Streams;

      it('コンフィグ情報の削除', async () => {
        expect.assertions(2);
        await app.service('streams').remove(stream1.id, { ...params });

        // encrypt-keysレコードが削除されていること
        const ret = await db('encrypt_keys').where('id', key0.id);
        expect(ret.length).toBe(0);

        // HashiCorp Vaultに暗号鍵が登録されていないことを確認する
        await expect(async () => {
          await vault.get(toVid(key0), { ...params });
        }).rejects.toThrowError(NotFound);
      });

      beforeEach(async () => {
        const name = 'config-002';
        stream1 = await app.service('streams').create({ name }, { ...params });
        key0 = await service.create({
          size: 256,
          target,
          stream_id: stream1.id,
        }, { ...params });
      });
    });

    beforeEach(async () => {
      key0 = await service.create({
        size: 256,
        target,
        comment,
        stream_id: stream.id,
        enabled: true,
      }, { ...params });
    });
  });

  describe('データ暗号鍵を取得する', () => {
    let key0: EncryptKeys;

    it('取得の実行', async () => {
      expect.assertions(1);
      const key = await service.get(key0.id, params);
      expect(key).toEqual(key0);
    });

    describe('joinEager', () => {
      describe('latestVersion', () => {
        it('暗号鍵の更新がない場合', async () => {
          expect.assertions(2);
          const query = { $joinEager: 'latestVersion' };
          const key = await service.get(key0.id, { ...params, query });
          const { latestVersion: vers, ...key1 } = key;
          expect(key1).toEqual(key0);
          expect(vers.ver).toBe(1);
        });

        describe('暗号鍵が更新されている場合', () => {
          let key1: EncryptKeys;
          it('key2', async () => {
            expect.assertions(2);
            const query = { $joinEager: 'latestVersion' };
            const key = await service.get(key1.id, { ...params, query });
            const { latestVersion: vers, ...key2 } = key;
            expect(key2).toEqual(key1);
            expect(vers.ver).toBe(2);
          });

          it('key1', async () => {
            expect.assertions(5);
            const query = { $joinEager: 'latestVersion' };
            const key = await service.get(key0.id, { ...params, query });
            const {
              latestVersion: vers, enabled, updatedAt, latest, ...key2
            } = key;
            const { enabled: _enabled0, updatedAt: updatedAt0, ...key0Params } = key0;
            expect(vers.ver).toBe(2);
            expect(key2).toEqual(key0Params);
            expect(enabled).toBe(false);
            expect(latest).toBe(false);
            expect(updatedAt).not.toBe(updatedAt0);
          });

          beforeEach(async () => {
            key1 = await service.create({
              size: 256,
              target,
              comment,
              stream_id: stream.id,
              enabled: true,
            }, { ...params });
          });
        });
      });

      it('stream', async () => {
        expect.assertions(2);
        const query = { $joinEager: 'stream' };
        const key = await service.get(key0.id, { ...params, query });
        const { stream: stream1, ...key1 } = key;
        expect(key1).toEqual(key0);
        expect(stream1).toEqual({ name: streamName, comment: streamComment });
      });

      it('user', async () => {
        expect.assertions(3);
        const query = { $joinEager: 'user' };
        const key = await service.get(key0.id, { ...params, query });
        const { user: relUser, ...key1 } = key;
        expect(key1).toEqual(key0);
        expect(relUser.name).toBe(user.name);
        expect(relUser.displayName).not.toBeNull();
      });
    });

    describe('権限のない利用者による取得', () => {
      it('共同利用者でない利用者', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(
            key0.id,
            { ...params2 },
          );
        }).rejects.toThrowError(NotFound);
      });

      it('データ管理者でない利用者', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(
            key0.id,
            { ...params1 },
          );
        }).rejects.toThrowError(NotFound);
      });
    });

    beforeEach(async () => {
      key0 = await service.create({
        size: 256,
        target,
        comment,
        stream_id: stream.id,
        enabled: true,
      }, { ...params });
    });
  });

  describe('データ暗号鍵を検索する', () => {
    let key0: EncryptKeys;
    let key1: EncryptKeys;
    let key2: EncryptKeys;

    it('全ての取得', async () => {
      expect.assertions(4);
      const res = await service.find(params);
      if (res instanceof Array) {
        expect(res.length).toBe(3);
        expect(res).toContainEqual(key2);
        expect(res).toContainEqual(key1);
        expect(res).toContainEqual(key0);
      }
    });

    it('検索条件の指定', async () => {
      expect.assertions(3);
      const query = { enabled: true };
      const res = await service.find({ ...params, query });
      if (res instanceof Array) {
        expect(res.length).toBe(2);
        expect(res).toContainEqual(key2);
        expect(res).toContainEqual(key1);
      }
    });

    describe('joinEager', () => {
      it('latestVersion', async () => {
        expect.assertions(3);
        const query = { $joinEager: 'latestVersion' };
        const res = await service.find({ ...params, query });
        if (res instanceof Array) {
          expect(res.length).toBe(3);
          const vers = res.map((x) => (x.latestVersion.ver));
          expect(vers.filter((x) => x === 1).length).toBe(1);
          expect(vers.filter((x) => x === 2).length).toBe(2);
        }
      });

      it('stream', async () => {
        expect.assertions(4);
        const query = { $joinEager: 'stream' };
        const res = await service.find({ ...params, query });
        if (res instanceof Array) {
          expect(res.length).toBe(3);
          res.forEach((key) => {
            const { stream: stream1 } = key;
            expect(stream1).toEqual({ name: streamName, comment: streamComment });
          });
        }
      });

      it('user', async () => {
        expect.assertions(7);
        const query = { $joinEager: 'user' };
        const res = await service.find({ ...params, query });
        if (res instanceof Array) {
          expect(res.length).toBe(3);
          res.forEach((key) => {
            const { user: relUser } = key;
            expect(relUser.name).toBe(user.name);
            expect(relUser.displayName).not.toBeNull();
          });
        }
      });
    });

    describe('権限のない利用者による取得', () => {
      it('共同利用者でない利用者', async () => {
        expect.assertions(1);
        const res = await service.find({ ...params2 });
        if (res instanceof Array) {
          expect(res.length).toBe(0);
        }
      });

      it('データ管理者でない利用者', async () => {
        expect.assertions(1);
        const res = await service.find({ ...params1 });
        if (res instanceof Array) {
          expect(res.length).toBe(0);
        }
      });
    });

    beforeEach(async () => {
      key0 = await service.create({
        size: 256,
        target,
        comment,
        stream_id: stream.id,
        enabled: true,
      }, { ...params });
      key1 = await service.create({
        size: 256,
        target,
        comment,
        stream_id: stream.id,
        enabled: true,
      }, { ...params });
      key0 = await service.get(key0.id, { ...params });
      key2 = await service.create({
        size: 256,
        target: 'service1.crypto.key',
        comment,
        stream_id: stream.id,
        enabled: true,
      }, { ...params });
    });
  });

  beforeEach(async () => {
    await db('streams').del();
    const test = { jest: true };
    params = { user, authentication, test };
    params1 = { user: user1, authentication: authentication1, test };
    params2 = { user: otherUser, authentication: authentication2, test };
    stream = await app.service('streams').create(
      {
        name: streamName,
        comment: streamComment,
      },
      { ...params },
    );
    await db('members').insert({ user_id: user1.id, stream_id: stream.id });
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
    const res = await app.service('authentication').create({ ...uinfo, strategy: 'local' }, {});
    const { payload, accessToken } = res.authentication;
    return { strategy: 'jwt', accessToken, payload };
  };

  beforeAll(async () => {
    db = app.get('knex');
    await db('members').del();
    await db('streams').del();
    await db('users').del();

    const userService = app.service('users');
    await db('users').insert(adminInfo);
    const [admin] = ((await userService.find({ query: { name: adminInfo.name } })) as Users[]);
    user = await userService.create(userInfo, { user: admin });
    user1 = await userService.create(user1Info, { user: admin });
    otherUser = await userService.create(otherUserInfo, { user: admin });
    authentication = await getAuthentication(userInfo);
    authentication1 = await getAuthentication(user1Info);
    authentication2 = await getAuthentication(otherUserInfo);
  });

  afterAll(async () => {
    await db('streams').del();
    await db('users').del();
  });
});
