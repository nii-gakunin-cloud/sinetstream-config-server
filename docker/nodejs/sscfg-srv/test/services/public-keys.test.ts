/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import { BadRequest, MethodNotAllowed, NotFound } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { generateKeyPairSync } from 'crypto';
import { Knex } from 'knex';
import sshpk from 'sshpk';
import app from '../../src/app';
import { toVid } from '../../src/hooks/process-public-key';
import { PublicKeys } from '../../src/models/public-keys.model';
import { Users } from '../../src/models/users.model';

describe('\'public-keys\' service', () => {
  let db: Knex;
  const service = app.service('public-keys');

  let user: Users;
  let otherUser: Users;
  let params: Params;
  let paramsOtherUser: Params;

  let openssh: string;
  let pkcs1: string;
  let pkcs8: string;
  let fingerprint: string;
  const comment = 'public key comment';
  let authentication: Record<string, any>;
  let authentication2: Record<string, any>;

  describe('公開鍵登録', () => {
    describe('公開鍵のフォーマット', () => {
      it('opensshの公開鍵を登録する', async () => {
        expect.assertions(5);
        const publicKey = await service.create(
          {
            publicKey: openssh,
            defaultKey: true,
            comment,
          },
          { ...params },
        );
        expect(publicKey.comment).toBe(comment);
        expect(publicKey.fingerprint).toBe(fingerprint);
        expect(publicKey.defaultKey).toBe(true);

        // HashiCorp Vaultに公開鍵が登録されていることを確認する
        const key = await app.service('vault').get(toVid(publicKey), { ...params });
        expect(key.publicKey).toBe(pkcs1);
        expect(key.fingerprint).toBe(fingerprint);
      });

      it('PKCS#1の公開鍵を登録する', async () => {
        expect.assertions(5);
        const publicKey = await service.create(
          {
            publicKey: pkcs1,
            defaultKey: true,
            comment,
          },
          { ...params },
        );
        expect(publicKey.comment).toBe(comment);
        expect(publicKey.fingerprint).toBe(fingerprint);
        expect(publicKey.defaultKey).toBe(true);

        // HashiCorp Vaultに公開鍵が登録されていることを確認する
        const key = await app.service('vault').get(toVid(publicKey), { ...params });
        expect(key.publicKey).toBe(pkcs1);
        expect(key.fingerprint).toBe(fingerprint);
      });

      it('PKCS#8の公開鍵を登録する', async () => {
        expect.assertions(5);
        const publicKey = await service.create(
          {
            publicKey: pkcs8,
            defaultKey: true,
            comment,
          },
          { ...params },
        );
        expect(publicKey.comment).toBe(comment);
        expect(publicKey.fingerprint).toBe(fingerprint);
        expect(publicKey.defaultKey).toBe(true);

        // HashiCorp Vaultに公開鍵が登録されていることを確認する
        const key = await app.service('vault').get(toVid(publicKey), { ...params });
        expect(key.publicKey).toBe(pkcs1);
        expect(key.fingerprint).toBe(fingerprint);
      });
    });

    describe('デフォルトフラグ', () => {
      describe('他に公開鍵がない場合', () => {
        it('デフォルトフラグがオン', async () => {
          expect.assertions(2);
          const publicKey = await service.create(
            {
              publicKey: openssh,
              defaultKey: true,
            },
            params,
          );
          expect(publicKey.fingerprint).toBe(fingerprint);
          expect(publicKey.defaultKey).toBe(true);
        });

        it('デフォルトフラグがオフ', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({ publicKey: openssh, defaultKey: false }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('デフォルトフラグを指定しない場合', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({ publicKey: openssh, defaultKey: false }, params);
          }).rejects.toThrowError(BadRequest);
        });
      });

      describe('他のデフォルト公開鍵が登録されている場合', () => {
        let otherOpensshKey: string;
        let otherPublicKey: PublicKeys;

        it('デフォルトフラグがオン', async () => {
          expect.assertions(4);
          const publicKey = await service.create(
            {
              publicKey: openssh,
              defaultKey: true,
            },
            { ...params },
          );
          expect(publicKey.fingerprint).toBe(fingerprint);
          expect(publicKey.defaultKey).toBe(true);

          // デフォルト設定だった公開鍵のフラグはオフになる
          const otherKey = await service.get(otherPublicKey.id, { ...params });
          expect(otherKey.defaultKey).toBe(false);
          expect(otherKey.fingerprint).toBe(otherPublicKey.fingerprint);
        });

        it('デフォルトフラグがオフ', async () => {
          expect.assertions(3);
          const publicKey = await service.create(
            {
              publicKey: openssh,
              defaultKey: false,
            },
            { ...params },
          );
          expect(publicKey.fingerprint).toBe(fingerprint);
          expect(publicKey.defaultKey).toBe(false);

          // 他の公開鍵は変更されない
          const otherKey = await service.get(otherPublicKey.id, { ...params });
          expect(otherKey).toEqual(otherPublicKey);
        });

        it('デフォルトフラグを指定しない場合', async () => {
          expect.assertions(3);
          const publicKey = await service.create({ publicKey: openssh }, { ...params });
          expect(publicKey.fingerprint).toBe(fingerprint);
          expect(publicKey.defaultKey).toBe(false);

          // 他の公開鍵は変更されない
          const otherKey = await service.get(otherPublicKey.id, { ...params });
          expect(otherKey).toEqual(otherPublicKey);
        });

        beforeEach(async () => {
          otherPublicKey = await service.create(
            { publicKey: otherOpensshKey, defaultKey: true },
            { ...params },
          );
        });

        beforeAll(() => {
          const { publicKey: pubKey } = generateKeyPairSync('rsa', { modulusLength: 3072 });
          otherOpensshKey = sshpk.parseKey(pubKey.export({ type: 'pkcs1', format: 'pem' }), 'auto').toString('ssh');
        });
      });
    });

    describe('異常系', () => {
      it('公開鍵が指定されていない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.create({ comment, defaultKey: false }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('正しくない公開鍵が指定された', async () => {
        const badPublicKey = 'ssh-rsa AAAAB user@example.org';
        expect.assertions(1);
        await expect(async () => {
          await service.create({ publicKey: badPublicKey }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('RSA以外の公開鍵が指定された', async () => {
        const { publicKey: ed25519pubKey } = generateKeyPairSync('ed25519');
        const ed25519 = ed25519pubKey.export({ type: 'spki', format: 'pem' });
        expect.assertions(1);
        await expect(async () => {
          await service.create({ publicKey: ed25519 }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('他ユーザの公開鍵は登録できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.create(
            {
              publicKey: openssh,
              defaultKey: true,
              comment,
              user_id: user.id,
            },
            { ...paramsOtherUser },
          );
        }).rejects.toThrowError(BadRequest);
      });
    });
  });

  describe('公開鍵情報の更新', () => {
    let publicKey: PublicKeys;

    it('コメントの変更', async () => {
      expect.assertions(3);
      const newComment = `new ${comment}`;
      const newPubKey = await service.patch(publicKey.id, { comment: newComment }, params);
      const { comment: _, updatedAt: updatedAt0, ...pubkeyParams0 } = publicKey;
      const { comment: comment1, updatedAt: updatedAt1, ...pubkeyParams1 } = newPubKey;
      expect(comment1).toBe(newComment);
      expect(updatedAt1).not.toBe(updatedAt0);
      expect(pubkeyParams1).toEqual(pubkeyParams0);
    });

    describe('デフォルトフラグ', () => {
      describe('他に公開鍵がある場合', () => {
        let otherOpensshKey: string;
        let otherPublicKey: PublicKeys;

        describe('他の公開鍵がデフォルトフラグオンの場合', () => {
          it('デフォルトフラグをオンに変更する', async () => {
            expect.assertions(5);
            expect(publicKey.defaultKey).toBe(false);
            const newPubKey = await service.patch(
              publicKey.id,
              { defaultKey: true },
              { ...params },
            );
            const { defaultKey: _, updatedAt: updatedAt0, ...pubkeyParams0 } = publicKey;
            const { defaultKey: defaultKey1, updatedAt: updatedAt1, ...pubkeyParams1 } = newPubKey;
            expect(defaultKey1).toBe(true);
            expect(updatedAt1).not.toBe(updatedAt0);
            expect(pubkeyParams1).toEqual(pubkeyParams0);

            // デフォルト設定だった公開鍵のフラグはオフになる
            const otherKey = await service.get(otherPublicKey.id, { ...params });
            expect(otherKey.defaultKey).toBe(false);
          });

          beforeEach(async () => {
            otherPublicKey = await service.create(
              {
                publicKey: otherOpensshKey,
                defaultKey: true,
              },
              { ...params },
            );
            publicKey = await service.get(publicKey.id, { ...params });
          });
        });

        describe('他の公開鍵がデフォルトフラグオフの場合', () => {
          it('デフォルトフラグをオフに変更する', async () => {
            expect.assertions(5);
            expect(publicKey.defaultKey).toBe(true);
            const newPubKey = await service.patch(
              publicKey.id,
              { defaultKey: false },
              { ...params },
            );
            const { defaultKey: _, updatedAt: updatedAt0, ...pubkeyParams0 } = publicKey;
            const { defaultKey: defaultKey1, updatedAt: updatedAt1, ...pubkeyParams1 } = newPubKey;
            expect(defaultKey1).toBe(false);
            expect(updatedAt1).not.toBe(updatedAt0);
            expect(pubkeyParams1).toEqual(pubkeyParams0);

            // 他の公開鍵のデフォルトフラグがオンになる
            const otherKey = await service.get(otherPublicKey.id, { ...params });
            expect(otherKey.defaultKey).toBe(true);
          });

          beforeEach(async () => {
            otherPublicKey = await service.create(
              {
                publicKey: otherOpensshKey,
                defaultKey: false,
              },
              { ...params },
            );
          });
        });

        beforeAll(() => {
          const { publicKey: pubKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
          otherOpensshKey = sshpk.parseKey(pubKey.export({ type: 'pkcs1', format: 'pem' }), 'auto').toString('ssh');
        });
      });

      it('他の公開鍵がない場合にデフォルトフラグをオフにする', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.patch(publicKey.id, { defaultKey: false }, params);
        }).rejects.toThrowError(BadRequest);
      });
    });

    describe('複数レコード操作', () => {
      it('コメント変更', async () => {
        const newComment = `new ${comment}`;
        await expect(async () => {
          await service.patch(null, { comment: newComment }, params);
        }).rejects.toThrowError(BadRequest);
      });

      beforeEach(async () => {
        const { publicKey: pubKey } = generateKeyPairSync('rsa', { modulusLength: 3072 });
        const otherOpensshKey = sshpk.parseKey(pubKey.export({ type: 'pkcs1', format: 'pem' }), 'auto').toString('ssh');
        await service.create(
          { publicKey: otherOpensshKey, defaultKey: false },
          { ...params },
        );
      });
    });

    describe('異常系', () => {
      it('フィンガープリントを更新できない', async () => {
        expect.assertions(1);
        const newValue = `${fingerprint}xxx`;
        await expect(async () => {
          await service.patch(publicKey.id, { fingerprint: newValue }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('公開鍵を更新できない', async () => {
        const { publicKey: newPubKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
        const newKey = newPubKey.export({ type: 'pkcs1', format: 'pem' });
        expect.assertions(1);
        await expect(async () => {
          await service.patch(publicKey.id, { publicKey: newKey }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('ユーザIDを更新できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.patch(publicKey.id, { user_id: otherUser.id }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('他ユーザの公開鍵は更新できない', async () => {
        expect.assertions(1);
        const newComment = `new ${comment}`;
        await expect(async () => {
          await service.patch(publicKey.id, { comment: newComment }, paramsOtherUser);
        }).rejects.toThrowError(BadRequest);
      });

      it('PUTで更新できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.update(publicKey.id, { defaultKey: false, comment }, params);
        }).rejects.toThrowError(MethodNotAllowed);
      });
    });

    beforeEach(async () => {
      publicKey = await service.create(
        {
          publicKey: openssh,
          defaultKey: true,
          comment,
        },
        { ...params },
      );
    });
  });

  describe('公開鍵の削除', () => {
    let publicKey: PublicKeys;
    describe('デフォルトフラグ', () => {
      it('他に公開鍵が登録されていない場合', async () => {
        expect.assertions(2);
        const res = await service.remove(publicKey.id, params);
        expect(res).toBeTruthy();

        // HashiCorp Vaultから公開鍵が削除されていることを確認する
        await expect(async () => {
          await app.service('vault').get(toVid(publicKey), params);
        }).rejects.toThrowError(NotFound);
      });

      describe('他に公開鍵が登録されている場合', () => {
        let otherOpensshKey: string;
        let otherPublicKey: PublicKeys;

        describe('他の公開鍵がデフォルトフラグオンの場合', () => {
          it('デフォルトフラグオフの公開鍵を削除する', async () => {
            expect.assertions(2);
            expect(publicKey.defaultKey).toBe(false);
            const res = await service.remove(publicKey.id, params);
            expect(res).toBeTruthy();
          });

          beforeEach(async () => {
            otherPublicKey = await service.create(
              {
                publicKey: otherOpensshKey,
                defaultKey: true,
              },
              { ...params },
            );
            publicKey = await service.get(publicKey.id, { ...params });
          });
        });

        describe('他の公開鍵がデフォルトフラグオフの場合', () => {
          it('デフォルトフラグオンの公開鍵を削除する', async () => {
            expect.assertions(3);
            expect(publicKey.defaultKey).toBe(true);
            const res = await service.remove(publicKey.id, { ...params });
            expect(res).toBeTruthy();

            // 他の公開鍵のデフォルトフラグがオンになる
            const otherKey = await service.get(otherPublicKey.id, { ...params });
            expect(otherKey.defaultKey).toBe(true);
          });

          beforeEach(async () => {
            otherPublicKey = await service.create(
              {
                publicKey: otherOpensshKey,
                defaultKey: false,
              },
              { ...params },
            );
          });
        });

        beforeAll(() => {
          const { publicKey: pubKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
          otherOpensshKey = sshpk.parseKey(pubKey.export({ type: 'pkcs1', format: 'pem' }), 'auto').toString('ssh');
        });
      });
    });

    describe('複数削除', () => {
      it('全て削除する', async () => {
        expect.assertions(1);
        await service.remove(null, { ...params });
        const res = await service.find({
          query: { $limit: 0 },
          ...params,
        });
        if (!(res instanceof Array)) {
          expect(res.total).toBe(0);
        }
      });

      it('他ユーザの公開鍵は削除されない', async () => {
        expect.assertions(2);
        await expect(async () => {
          await service.remove(null, paramsOtherUser);
        }).rejects.toThrowError(NotFound);
        const res = await service.find({
          query: { $limit: 0 },
          ...params,
        });
        if (!(res instanceof Array)) {
          expect(res.total).toBe(1);
        }
      });

      describe('複数レコードがある場合', () => {
        let otherOpensshKey: string;
        let otherPublicKey: PublicKeys;

        it('デフォルト公開鍵を削除する', async () => {
          expect.assertions(3);
          expect(otherPublicKey.defaultKey).toBe(false);
          await service.remove(null, { ...params, query: { defaultKey: true } });
          const res = await service.find({ query: { $limit: 0 }, ...params });
          if (!(res instanceof Array)) {
            expect(res.total).toBe(1);
          }
          const pubKey = await service.get(otherPublicKey.id, { ...params });
          expect(pubKey.defaultKey).toBe(true);
        });

        it('デフォルト以外の公開鍵を削除する', async () => {
          expect.assertions(3);
          expect(publicKey.defaultKey).toBe(true);
          await service.remove(null, { ...params, query: { defaultKey: false } });
          const res = await service.find({ query: { $limit: 0 }, ...params });
          if (!(res instanceof Array)) {
            expect(res.total).toBe(1);
          }
          const pubKey = await service.get(publicKey.id, { ...params });
          expect(pubKey.defaultKey).toBe(true);
        });

        it('全て削除する', async () => {
          expect.assertions(1);
          await service.remove(null, { ...params });
          const res = await service.find({ query: { $limit: 0 }, ...params });
          if (!(res instanceof Array)) {
            expect(res.total).toBe(0);
          }
        });

        beforeEach(async () => {
          otherPublicKey = await service.create(
            { publicKey: otherOpensshKey, defaultKey: false },
            { ...params },
          );
        });

        beforeAll(() => {
          const { publicKey: pubKey } = generateKeyPairSync('rsa', { modulusLength: 3072 });
          otherOpensshKey = sshpk.parseKey(pubKey.export({ type: 'pkcs1', format: 'pem' }), 'auto').toString('ssh');
        });
      });
    });

    describe('異常系', () => {
      it('他ユーザの公開鍵を削除できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.remove(publicKey.id, paramsOtherUser);
        }).rejects.toThrowError(NotFound);
      });
    });

    beforeEach(async () => {
      publicKey = await service.create(
        {
          publicKey: openssh,
          defaultKey: true,
          comment,
        },
        { ...params },
      );
    });
  });

  describe('公開鍵情報の取得', () => {
    let publicKey: PublicKeys;

    describe('特定の公開鍵情報を取得する', () => {
      it('取得できる項目の確認', async () => {
        expect.assertions(7);
        const pubKey = await service.get(publicKey.id, params);
        expect(pubKey.fingerprint).toBe(publicKey.fingerprint);
        expect(pubKey.defaultKey).toBe(publicKey.defaultKey);
        expect(pubKey.comment).toBe(publicKey.comment);
        expect(pubKey.user_id).toBe(user.id);
        expect(pubKey.createdAt).toBeTruthy();
        expect(pubKey.updatedAt).toBeTruthy();
        expect(pubKey.publicKey).toBeUndefined();
      });

      it('他ユーザの公開鍵を取得できないこと', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(publicKey.id, paramsOtherUser);
        }).rejects.toThrowError(NotFound);
      });
    });

    describe('公開鍵情報を検索する', () => {
      it('全ての公開鍵を取得できること', async () => {
        expect.assertions(1);
        const res = await service.find(params);
        if (res instanceof Array) {
          expect(res.length).toBe(1);
        }
      });

      it('検索条件の指定', async () => {
        expect.assertions(1);
        const res = await service.find({ ...params, query: { defaultKey: false } });
        if (res instanceof Array) {
          expect(res.length).toBe(0);
        }
      });

      describe('他ユーザの公開鍵を取得できないこと', () => {
        it('検索条件を指定しない場合', async () => {
          expect.assertions(1);
          const res = await service.find(paramsOtherUser);
          if (res instanceof Array) {
            expect(res.length).toBe(0);
          }
        });

        it('user_idを検索条件に指定した場合', async () => {
          expect.assertions(1);
          const res = await service.find({ ...paramsOtherUser, query: { user_id: user.id } });
          if (res instanceof Array) {
            expect(res.length).toBe(0);
          }
        });
      });
    });

    beforeEach(async () => {
      publicKey = await service.create(
        {
          publicKey: openssh,
          defaultKey: true,
          comment,
        },
        { ...params },
      );
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
    await db('public_keys').del();
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
    await db('users').insert(adminInfo);
    const userService = app.service('users');
    const [admin] = ((await userService.find({ query: { name: adminInfo.name } })) as Users[]);
    user = await userService.create(userInfo, { user: admin });
    otherUser = await userService.create(userInfo2, { user: admin });
    authentication = await getAuthentication(userInfo);
    authentication2 = await getAuthentication(userInfo2);

    const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 3072 });
    const pubKey = sshpk.parseKey(publicKey.export({ type: 'pkcs1', format: 'pem' }), 'auto');
    openssh = pubKey.toString('ssh');
    pkcs1 = pubKey.toString('pkcs1');
    pkcs8 = pubKey.toString('pkcs8');
    fingerprint = pubKey.fingerprint('sha256').toString();
  });

  afterAll(async () => {
    await db('public_keys').del();
    await db('users').del();
  });
});
