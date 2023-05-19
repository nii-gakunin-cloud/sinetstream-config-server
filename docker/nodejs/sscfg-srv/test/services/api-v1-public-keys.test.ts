import { BadRequest, MethodNotAllowed, NotFound } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { generateKeyPairSync } from 'crypto';
import { Knex } from 'knex';
import sshpk from 'sshpk';
import app from '../../src/app';
import { Users } from '../../src/models/users.model';

describe('\'api-v1-public-keys\' service', () => {
  let db: Knex;
  const service = app.service('api/v1/public-keys');
  let user0: Users;
  let user1: Users;
  let params: Params;
  let params1: Params;

  let openssh: string;
  let pkcs1: string;
  let pkcs8: string;
  let fingerprint: string;
  const comment = 'public key comment';

  describe('公開鍵登録', () => {
    describe('公開鍵のフォーマット', () => {
      it('opensshの公開鍵を登録する', async () => {
        expect.assertions(3);
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
      });

      it('PKCS#1の公開鍵を登録する', async () => {
        expect.assertions(3);
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
      });

      it('PKCS#8の公開鍵を登録する', async () => {
        expect.assertions(3);
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
      });
    });

    describe('デフォルトフラグ', () => {
      describe('他に公開鍵がない場合', () => {
        it('デフォルトフラグがオン', async () => {
          expect.assertions(2);
          const publicKey = await service.create(
            { publicKey: openssh, defaultKey: true },
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
          expect.assertions(2);
          const publicKey = await service.create(
            { publicKey: openssh },
            params,
          );
          expect(publicKey.fingerprint).toBe(fingerprint);
          expect(publicKey.defaultKey).toBe(true);
        });
      });

      describe('他のデフォルト公開鍵が登録されている場合', () => {
        let otherOpensshKey: string;
        let otherPublicKey: Record<string, any>;

        it('デフォルトフラグがオン', async () => {
          expect.assertions(4);
          const publicKey = await service.create(
            { publicKey: openssh, defaultKey: true },
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
          expect.assertions(4);
          const publicKey = await service.create({ publicKey: openssh }, { ...params });
          expect(publicKey.fingerprint).toBe(fingerprint);
          expect(publicKey.defaultKey).toBe(true);

          // デフォルト設定だった公開鍵のフラグはオフになる
          const otherKey = await service.get(otherPublicKey.id, { ...params });
          expect(otherKey.defaultKey).toBe(false);
          expect(otherKey.fingerprint).toBe(otherPublicKey.fingerprint);
        });

        beforeEach(async () => {
          otherPublicKey = await service.create(
            { publicKey: otherOpensshKey },
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
              user_id: user1.id,
            },
            { ...params },
          );
        }).rejects.toThrowError(BadRequest);
      });
    });
  });

  describe('公開鍵の更新', () => {
    let publicKey: Record<string, any>;

    it('コメントの変更', async () => {
      expect.assertions(3);
      const newComment = `new ${comment}`;
      const newPubKey = await service.patch(publicKey.id, { comment: newComment }, { ...params });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { comment: _, updatedAt: updatedAt0, ...pubkeyParams0 } = publicKey;
      const { comment: comment1, updatedAt: updatedAt1, ...pubkeyParams1 } = newPubKey;
      expect(comment1).toBe(newComment);
      expect(updatedAt1).not.toBe(updatedAt0);
      expect(pubkeyParams1).toEqual(pubkeyParams0);
    });

    describe('デフォルトフラグ', () => {
      describe('他に公開鍵がある場合', () => {
        let otherOpensshKey: string;
        let otherPublicKey: Record<string, any>;

        describe('他の公開鍵がデフォルトフラグオンの場合', () => {
          it('デフォルトフラグをオンに変更する', async () => {
            expect.assertions(5);
            expect(publicKey.defaultKey).toBe(false);
            const newPubKey = await service.patch(
              publicKey.id,
              { defaultKey: true },
              { ...params },
            );
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          await service.patch(publicKey.id, { defaultKey: false }, { ...params });
        }).rejects.toThrowError(BadRequest);
      });
    });

    describe('複数レコード操作', () => {
      it('コメント変更', async () => {
        const newComment = `new ${comment}`;
        await expect(async () => {
          await service.patch(null, { comment: newComment }, { ...params });
        }).rejects.toThrowError(MethodNotAllowed);
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
          await service.patch(publicKey.id, { fingerprint: newValue }, { ...params });
        }).rejects.toThrowError(BadRequest);
      });

      it('公開鍵を更新できない', async () => {
        const { publicKey: newPubKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
        const newKey = newPubKey.export({ type: 'pkcs1', format: 'pem' });
        expect.assertions(1);
        await expect(async () => {
          await service.patch(publicKey.id, { publicKey: newKey }, { ...params });
        }).rejects.toThrowError(BadRequest);
      });

      it('ユーザIDを更新できない', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.patch(publicKey.id, { user_id: user1.id }, { ...params });
        }).rejects.toThrowError(BadRequest);
      });

      it('他ユーザの公開鍵は更新できない', async () => {
        expect.assertions(1);
        const newComment = `new ${comment}`;
        await expect(async () => {
          await service.patch(publicKey.id, { comment: newComment }, { ...params1 });
        }).rejects.toThrowError(BadRequest);
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
    let publicKey: Record<string, any>;
    describe('デフォルトフラグ', () => {
      it('他に公開鍵が登録されていない場合', async () => {
        expect.assertions(1);
        const res = await service.remove(publicKey.id, params);
        expect(res).toBeTruthy();
      });

      describe('他に公開鍵が登録されている場合', () => {
        let otherOpensshKey: string;
        let otherPublicKey: Record<string, any>;

        describe('他の公開鍵がデフォルトフラグオンの場合', () => {
          it('デフォルトフラグオフの公開鍵を削除する', async () => {
            expect.assertions(2);
            expect(publicKey.defaultKey).toBe(false);
            const res = await service.remove(publicKey.id, { ...params });
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
          await service.remove(null, { ...params1 });
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
        let otherPublicKey: Record<string, any>;

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
          await service.remove(publicKey.id, { ...params1 });
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
    let publicKey: Record<string, any>;

    describe('特定の公開鍵情報を取得する', () => {
      it('取得できる項目の確認', async () => {
        expect.assertions(6);
        const pubKey = await service.get(publicKey.id, { ...params });
        expect(pubKey.fingerprint).toBe(publicKey.fingerprint);
        expect(pubKey.defaultKey).toBe(publicKey.defaultKey);
        expect(pubKey.comment).toBe(publicKey.comment);
        expect(pubKey.createdAt).toBeTruthy();
        expect(pubKey.updatedAt).toBeTruthy();
        expect(pubKey.publicKey).toBeUndefined();
      });

      it('他ユーザの公開鍵を取得できないこと', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(publicKey.id, { ...params1 });
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

      it('前方一致の検索条件', async () => {
        expect.assertions(1);
        const query = {
          fingerprint: {
            $like: `${fingerprint.substring(0, 10)}%`,
          },
        };
        const res = await service.find({ ...params, query });
        if (res instanceof Array) {
          expect(res.length).toBe(1);
        }
      });

      it('検索件数の取得', async () => {
        expect.assertions(1);
        const res = await service.find({ ...params, query: { $limit: 0 } });
        if (!(res instanceof Array)) {
          expect(res.total).toBe(1);
        }
      });

      describe('他ユーザの公開鍵を取得できないこと', () => {
        it('検索条件を指定しない場合', async () => {
          expect.assertions(1);
          const res = await service.find({ ...params1 });
          if (res instanceof Array) {
            expect(res.length).toBe(0);
          }
        });

        it('user_idを検索条件に指定した場合', async () => {
          expect.assertions(1);
          const res = await service.find({ ...params1, query: { user_id: user0.id } });
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
  const userInfo0 = {
    name: 'user00',
    password: 'pass00',
    displayName: 'admin user',
  };
  const userInfo1 = {
    name: 'user01',
    password: 'pass01',
  };

  const getAuthentication = async (uinfo: Record<string, string>, strategy = 'local'): Promise<Record<string, any>> => {
    const res = await app.service('authentication').create({ ...uinfo, strategy }, {});
    const { payload, accessToken } = res.authentication;
    return { strategy: 'jwt', accessToken, payload };
  };

  const generateSecretId = async (
    admin: Users,
    info: Record<string, any>,
  ): Promise<Record<string, any>> => {
    const test = { jest: true };
    const userService = app.service('users');
    const user = await userService.create(info, { user: admin });
    const accessKeyService = app.service('access-keys');
    const authentication = await getAuthentication(info);
    const accessKey = await accessKeyService.create(
      { allPermitted: true },
      { user, authentication, test },
    );
    const auth = await getAuthentication({
      user: info.name,
      'secret-key': accessKey.secretId,
    }, 'api-access');
    const prms = { user, authentication: auth, test };
    return { user, params: prms };
  };

  beforeEach(async () => {
    await db('public_keys').del();
  });

  beforeAll(async () => {
    db = app.get('knex');
    await db('api_access_keys').del();
    await db('users').del();

    await db('users').insert(adminInfo);
    const userService = app.service('users');
    const [admin] = ((await userService.find({ query: { name: adminInfo.name } })) as Users[]);
    const u0 = await generateSecretId(admin, userInfo0);
    const u1 = await generateSecretId(admin, userInfo1);
    user0 = u0.user;
    params = u0.params;
    user1 = u1.user;
    params1 = u1.params;

    const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 3072 });
    const pubKey = sshpk.parseKey(publicKey.export({ type: 'pkcs1', format: 'pem' }), 'auto');
    openssh = pubKey.toString('ssh');
    pkcs1 = pubKey.toString('pkcs1');
    pkcs8 = pubKey.toString('pkcs8');
    fingerprint = pubKey.fingerprint('sha256').toString();
  });

  afterAll(async () => {
    await db('api_access_keys').del();
    await db('public_keys').del();
    await db('users').del();
  });
});
