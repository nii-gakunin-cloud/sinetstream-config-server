/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import {
  BadRequest, Forbidden, MethodNotAllowed, NotFound,
} from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { randomBytes } from 'crypto';
import knex from 'knex';
import app from '../../src/app';
import { toVid } from '../../src/hooks/process-attach-files';
import { Streams } from '../../src/models/streams.model';
import { Users } from '../../src/models/users.model';
import { AttachFiles } from '../../src/models/attach-files.model';

describe('\'attach-files\' service', () => {
  let db: knex;
  const service = app.service('attach-files');
  const vault = app.service('vault');
  let user: Users;
  let user1: Users;
  let otherUser: Users;
  let stream: Streams;
  let params: Params;
  let params1: Params;
  let params2: Params;
  const target = '*.tls.ca_certs';
  const comment = 'comment';
  let content: string;
  const streamName = 'config-001';
  const streamComment = 'config-001 comment';
  let authentication: Record<string, any>;
  let authentication1: Record<string, any>;
  let authentication2: Record<string, any>;

  describe('添付ファイルを登録する', () => {
    it('秘匿情報でない場合', async () => {
      expect.assertions(11);
      const attachFile = await service.create({
        content,
        target,
        comment,
        stream_id: stream.id,
        enabled: true,
        secret: false,
      }, params);
      expect(attachFile.id).not.toBeNull();
      expect(attachFile.secret).toBe(false);
      expect(attachFile.stream_id).toBe(stream.id);
      expect(attachFile.target).toBe(target);
      expect(attachFile.enabled).toBe(true);
      expect(attachFile.comment).toBe(comment);
      expect(attachFile.createdAt).not.toBeNull();
      expect(attachFile.updatedAt).not.toBeNull();
      expect(attachFile.createdUser).toBe(user.id);
      expect(attachFile.updatedUser).toBe(user.id);
      expect(attachFile.content).toBeUndefined();
    });

    it('秘匿情報の場合', async () => {
      expect.assertions(13);
      const attachFile = await service.create({
        content,
        target,
        comment,
        stream_id: stream.id,
        enabled: true,
        secret: true,
      }, { ...params });
      expect(attachFile.id).not.toBeNull();
      expect(attachFile.secret).toBe(true);
      expect(attachFile.stream_id).toBe(stream.id);
      expect(attachFile.target).toBe(target);
      expect(attachFile.enabled).toBe(true);
      expect(attachFile.comment).toBe(comment);
      expect(attachFile.createdAt).not.toBeNull();
      expect(attachFile.updatedAt).not.toBeNull();
      expect(attachFile.createdUser).toBe(user.id);
      expect(attachFile.updatedUser).toBe(user.id);
      expect(attachFile.content).toBeUndefined();

      // HashiCorp Vaultに添付ファイルが登録されていることを確認する
      const secret = await vault.get(toVid(attachFile), { ...params });
      expect(secret.size).toBe(32);
      expect(secret.value).toBe(content);
    });

    it('デフォルト指定', async () => {
      expect.assertions(11);
      const attachFile = await service.create({
        content,
        target,
        stream_id: stream.id,
      }, params);
      expect(attachFile.id).not.toBeNull();
      expect(attachFile.secret).toBe(false);
      expect(attachFile.stream_id).toBe(stream.id);
      expect(attachFile.target).toBe(target);
      expect(attachFile.enabled).toBe(true);
      expect(attachFile.comment).toBeNull();
      expect(attachFile.createdAt).not.toBeNull();
      expect(attachFile.updatedAt).not.toBeNull();
      expect(attachFile.createdUser).toBe(user.id);
      expect(attachFile.updatedUser).toBe(user.id);
      expect(attachFile.content).toBeUndefined();
    });

    describe('異常系', () => {
      describe('必須項目が指定されていない', () => {
        it('stream_id', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              content,
              target,
              comment,
              enabled: true,
              secret: false,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('content', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              target,
              comment,
              stream_id: stream.id,
              enabled: true,
              secret: false,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('target', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              content,
              comment,
              stream_id: stream.id,
              enabled: true,
              secret: false,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });
      });
      describe('妥当でないパラメータの指定', () => {
        it('stream_id', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              content,
              target,
              comment,
              stream_id: -1,
              enabled: true,
              secret: false,
            }, params);
          }).rejects.toThrowError(Forbidden);
        });

        it.each([' ', '*', '*..xxx', '*.xxx.*.xxx'])('正しくない書式のtarget指定', async (tgt) => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              content,
              target: tgt,
              comment,
              stream_id: stream.id,
              enabled: true,
              secret: false,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });
      });
      describe('権限のない利用者による登録', () => {
        it('共同利用者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create(
              {
                content,
                target,
                comment,
                stream_id: stream.id,
                enabled: true,
                secret: false,
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
                content,
                target,
                comment,
                stream_id: stream.id,
                enabled: true,
                secret: false,
              },
              { ...params1 },
            );
          }).rejects.toThrowError(Forbidden);
        });
      });
    });
  });

  describe('添付ファイルを更新する', () => {
    let attachFile0: AttachFiles;

    describe.each([true, false])('項目の変更: enabled=%p', (enabled) => {
      it('comment', async () => {
        expect.assertions(3);
        const newComment = `new-${comment}`;
        const attachFile = await service.patch(
          attachFile0.id,
          { comment: newComment },
          { ...params },
        );
        const { comment: _comment, updatedAt: updatedAt0, ...oParams0 } = attachFile0;
        const { comment: comment1, updatedAt: updatedAt1, ...oParams1 } = attachFile;
        expect(comment1).toBe(newComment);
        expect(updatedAt1).not.toEqual(updatedAt0);
        expect(oParams1).toEqual(oParams0);
      });

      it('target', async () => {
        expect.assertions(3);
        const newTarget = `${target}.xxx`;
        const attachFile = await service.patch(
          attachFile0.id,
          { target: newTarget },
          { ...params },
        );
        const { target: _target, updatedAt: updatedAt0, ...oParams0 } = attachFile0;
        const { target: target1, updatedAt: updatedAt1, ...oParams1 } = attachFile;
        expect(target1).toBe(newTarget);
        expect(updatedAt1).not.toEqual(updatedAt0);
        expect(oParams1).toEqual(oParams0);
      });

      it('enabled', async () => {
        expect.assertions(3);
        const attachFile = await service.patch(
          attachFile0.id,
          { enabled: !enabled },
          { ...params },
        );
        const { enabled: _enabled, updatedAt: updatedAt0, ...oParams0 } = attachFile0;
        const { enabled: enabled1, updatedAt: updatedAt1, ...oParams1 } = attachFile;
        expect(enabled1).not.toBe(enabled);
        expect(updatedAt1).not.toEqual(updatedAt0);
        expect(oParams1).toEqual(oParams0);
      });

      beforeEach(async () => {
        attachFile0 = await service.create({
          content,
          target,
          comment,
          stream_id: stream.id,
          enabled,
          secret: false,
        }, { ...params });
      });
    });

    describe.each([true, false])('secret=%p', (beforeSecret) => {
      const newContent = randomBytes(32).toString('base64');
      describe('contentを指定しない場合', () => {
        it('secret=false', async () => {
          expect.assertions(6);
          const attachFile = await service.patch(
            attachFile0.id,
            { secret: false },
            { ...params },
          );
          const { secret: _secret, updatedAt: updatedAt0, ...oParams0 } = attachFile0;
          const { secret: secret1, updatedAt: updatedAt1, ...oParams1 } = attachFile;
          expect(secret1).toBe(false);
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(oParams1).toEqual(oParams0);

          // テーブルに記録されている content の値を確認する
          const ret = await db('attach_files').where('id', attachFile0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content.toString('base64')).toBe(content);

          // HashiCorp Vaultに添付ファイルが登録されていないことを確認する
          await expect(async () => {
            await vault.get(toVid(attachFile), { ...params });
          }).rejects.toThrowError(NotFound);
        });

        it('secret=true', async () => {
          expect.assertions(7);
          const attachFile = await service.patch(
            attachFile0.id,
            { secret: true },
            { ...params },
          );
          const { secret: _secret, updatedAt: updatedAt0, ...oParams0 } = attachFile0;
          const { secret: secret1, updatedAt: updatedAt1, ...oParams1 } = attachFile;
          expect(secret1).toBe(true);
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(oParams1).toEqual(oParams0);

          // テーブルにcontentが記録されてないことを確認する
          const ret = await db('attach_files').where('id', attachFile0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content).toBeNull();

          // HashiCorp Vaultに添付ファイルが登録されていることを確認する
          const secret = await vault.get(toVid(attachFile), { ...params });
          expect(secret.size).toBe(32);
          expect(secret.value).toBe(content);
        });
      });

      describe('contentを指定する場合', () => {
        it('secret=false', async () => {
          expect.assertions(6);
          const attachFile = await service.patch(
            attachFile0.id,
            { secret: false, content: newContent },
            { ...params },
          );
          const { secret: _secret, updatedAt: updatedAt0, ...oParams0 } = attachFile0;
          const { secret: secret1, updatedAt: updatedAt1, ...oParams1 } = attachFile;
          expect(secret1).toBe(false);
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(oParams1).toEqual(oParams0);

          // テーブルに記録されている content の値を確認する
          const ret = await db('attach_files').where('id', attachFile0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content.toString('base64')).toBe(newContent);

          // HashiCorp Vaultに添付ファイルが登録されていないことを確認する
          await expect(async () => {
            await vault.get(toVid(attachFile), { ...params });
          }).rejects.toThrowError(NotFound);
        });

        it('secret=true', async () => {
          expect.assertions(7);
          const attachFile = await service.patch(
            attachFile0.id,
            { secret: true, content: newContent },
            { ...params },
          );
          const { secret: _secret, updatedAt: updatedAt0, ...oParams0 } = attachFile0;
          const { secret: secret1, updatedAt: updatedAt1, ...oParams1 } = attachFile;
          expect(secret1).toBe(true);
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(oParams1).toEqual(oParams0);

          // テーブルにcontentが記録されてないことを確認する
          const ret = await db('attach_files').where('id', attachFile0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content).toBeNull();

          // HashiCorp Vaultに添付ファイルが登録されていることを確認する
          const secret = await vault.get(toVid(attachFile), { ...params });
          expect(secret.size).toBe(32);
          expect(secret.value).toBe(newContent);
        });
      });

      beforeEach(async () => {
        attachFile0 = await service.create({
          content,
          target,
          comment,
          stream_id: stream.id,
          secret: beforeSecret,
        }, { ...params });
      });
    });

    describe('content', () => {
      const newContent = randomBytes(32).toString('base64');

      describe('秘匿情報でないものとして登録されている場合', () => {
        it('変更を実行する', async () => {
          expect.assertions(5);
          const attachFile = await service.patch(
            attachFile0.id,
            { content: newContent },
            { ...params },
          );
          const { updatedAt: updatedAt0, ...oParams0 } = attachFile0;
          const { updatedAt: updatedAt1, ...oParams1 } = attachFile;
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(oParams1).toEqual(oParams0);

          // テーブルに記録されている content の値を確認する
          const ret = await db('attach_files').where('id', attachFile0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content.toString('base64')).toBe(newContent);

          // HashiCorp Vaultに添付ファイルが登録されていないことを確認する
          await expect(async () => {
            await vault.get(toVid(attachFile), { ...params });
          }).rejects.toThrowError(NotFound);
        });

        beforeEach(async () => {
          attachFile0 = await service.create({
            content,
            target,
            comment,
            stream_id: stream.id,
            secret: false,
          }, { ...params });
        });
      });

      describe('秘匿情報として登録されている場合', () => {
        it('変更を実行する', async () => {
          expect.assertions(6);
          const attachFile = await service.patch(
            attachFile0.id,
            { content: newContent },
            { ...params },
          );
          const { updatedAt: updatedAt0, ...oParams0 } = attachFile0;
          const { updatedAt: updatedAt1, ...oParams1 } = attachFile;
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(oParams1).toEqual(oParams0);

          // テーブルにcontentが記録されてないことを確認する
          const ret = await db('attach_files').where('id', attachFile0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content).toBeNull();

          // HashiCorp Vaultに添付ファイルが登録されていることを確認する
          const secret = await vault.get(toVid(attachFile), { ...params });
          expect(secret.size).toBe(32);
          expect(secret.value).toBe(newContent);
        });

        beforeEach(async () => {
          attachFile0 = await service.create({
            content,
            target,
            comment,
            stream_id: stream.id,
            secret: true,
          }, { ...params });
        });
      });
    });
    describe('異常系', () => {
      describe('変更不可の項目', () => {
        describe('stream_id', () => {
          let stream1: Streams;

          it('変更の実行', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.patch(attachFile0.id, { stream_id: stream1.id }, params);
            }).rejects.toThrowError(BadRequest);
          });

          beforeEach(async () => {
            const name = 'config-002';
            stream1 = await app.service('streams').create({ name }, { ...params });
          });
        });
      });

      describe('妥当でないパラメータの指定', () => {
        it.each([' ', '*', '*..xxx', '*.xxx.*.xxx'])('正しくない書式のtarget指定', async (tgt) => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(attachFile0.id, { target: tgt }, params);
          }).rejects.toThrowError(BadRequest);
        });
      });

      describe('権限のない利用者による更新', () => {
        it('共同利用者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(
              attachFile0.id,
              { enabled: false },
              { ...params2 },
            );
          }).rejects.toThrowError(Forbidden);
        });

        it('データ管理者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(
              attachFile0.id,
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
            attachFile0.id,
            {
              content,
              target,
              comment,
              stream_id: stream.id,
              enabled: true,
              secret: true,
            },
            params,
          );
        }).rejects.toThrowError(MethodNotAllowed);
      });

      beforeEach(async () => {
        attachFile0 = await service.create({
          content,
          target,
          comment,
          stream_id: stream.id,
          secret: false,
        }, { ...params });
      });
    });
  });

  describe('添付ファイルを削除する', () => {
    let attachFile0: AttachFiles;

    describe.each([true, false])('添付ファイルの削除: secret=%p', (secret) => {
      it('削除の実行', async () => {
        expect.assertions(2);
        const res = await service.remove(attachFile0.id, { ...params });
        expect(res).toBeTruthy();

        // HashiCorp Vaultに添付ファイルが登録されていないことを確認する
        await expect(async () => {
          await vault.get(toVid(attachFile0), { ...params });
        }).rejects.toThrowError(NotFound);
      });

      beforeEach(async () => {
        attachFile0 = await service.create({
          content,
          target,
          comment,
          stream_id: stream.id,
          secret,
        }, { ...params });
      });
    });

    describe.each([true, false])('コンフィグ情報の削除にあわせて削除されること: %p', (secret) => {
      let stream1: Streams;

      it('コンフィグ情報の削除', async () => {
        expect.assertions(2);
        await app.service('streams').remove(stream1.id, { ...params });

        // encrypt-keysレコードが削除されていること
        const ret = await db('encrypt_keys').where('id', attachFile0.id);
        expect(ret.length).toBe(0);

        // HashiCorp Vaultに添付ファイルが登録されていないことを確認する
        await expect(async () => {
          await vault.get(toVid(attachFile0), { ...params });
        }).rejects.toThrowError(NotFound);
      });

      beforeEach(async () => {
        const name = 'config-002';
        stream1 = await app.service('streams').create({ name }, { ...params });
        attachFile0 = await service.create({
          content,
          target,
          comment,
          stream_id: stream1.id,
          secret,
        }, { ...params });
      });
    });

    describe('異常系', () => {
      describe('権限のない利用者による削除', () => {
        it('共同利用者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.remove(
              attachFile0.id,
              { ...params2 },
            );
          }).rejects.toThrowError(Forbidden);
        });

        it('データ管理者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.remove(
              attachFile0.id,
              { ...params1 },
            );
          }).rejects.toThrowError(Forbidden);
        });
      });

      beforeEach(async () => {
        attachFile0 = await service.create({
          content,
          target,
          comment,
          stream_id: stream.id,
          secret: false,
        }, { ...params });
      });
    });
  });

  describe.each([true, false])('添付ファイルを取得する: secret=%p', (secret) => {
    let attachFile0: AttachFiles;

    it('取得の実行', async () => {
      expect.assertions(2);
      const key = await service.get(attachFile0.id, params);
      expect(key).toEqual(attachFile0);
      expect(key.content).toBeUndefined();
    });

    describe('joinEager', () => {
      it('stream', async () => {
        expect.assertions(2);
        const query = { $joinEager: 'stream' };
        const attachFile = await service.get(attachFile0.id, { ...params, query });
        const { stream: stream1, ...attachFile1 } = attachFile;
        expect(attachFile1).toEqual(attachFile0);
        expect(stream1).toEqual({ name: streamName, comment: streamComment });
      });

      it('user', async () => {
        expect.assertions(3);
        const query = { $joinEager: 'user' };
        const attachFile = await service.get(attachFile0.id, { ...params, query });
        const { user: relUser, ...attachFile1 } = attachFile;
        expect(attachFile1).toEqual(attachFile0);
        expect(relUser.name).toBe(user.name);
        expect(relUser.displayName).not.toBeNull();
      });
    });

    describe('権限のない利用者による取得', () => {
      it('共同利用者でない利用者', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(
            attachFile0.id,
            { ...params2 },
          );
        }).rejects.toThrowError(NotFound);
      });

      it('データ管理者でない利用者', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(
            attachFile0.id,
            { ...params1 },
          );
        }).rejects.toThrowError(NotFound);
      });
    });

    beforeEach(async () => {
      attachFile0 = await service.create({
        content,
        target,
        comment,
        stream_id: stream.id,
        secret,
      }, { ...params });
    });
  });

  describe('添付ファイルを検索する', () => {
    let attachFile0: AttachFiles;
    let attachFile1: AttachFiles;
    let attachFile2: AttachFiles;

    it('全ての取得', async () => {
      expect.assertions(4);
      const res = await service.find(params);
      if (res instanceof Array) {
        expect(res.length).toBe(3);
        expect(res).toContainEqual(attachFile2);
        expect(res).toContainEqual(attachFile1);
        expect(res).toContainEqual(attachFile0);
      }
    });

    it('検索条件の指定', async () => {
      expect.assertions(3);
      const query = { enabled: true };
      const res = await service.find({ ...params, query });
      if (res instanceof Array) {
        expect(res.length).toBe(2);
        expect(res).toContainEqual(attachFile1);
        expect(res).toContainEqual(attachFile0);
      }
    });

    describe('joinEager', () => {
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

    describe('権限のない利用者による検索', () => {
      it('共同利用者でない利用者', async () => {
        expect.assertions(1);
        const res = await service.find(
          { ...params2 },
        );
        if (res instanceof Array) {
          expect(res.length).toBe(0);
        }
      });

      it('データ管理者でない利用者', async () => {
        expect.assertions(1);
        const res = await service.find(
          { ...params1 },
        );
        if (res instanceof Array) {
          expect(res.length).toBe(0);
        }
      });
    });

    beforeEach(async () => {
      attachFile0 = await service.create({
        content,
        target,
        comment,
        stream_id: stream.id,
        secret: false,
      }, { ...params });
      attachFile1 = await service.create({
        content,
        target,
        comment,
        stream_id: stream.id,
        secret: true,
      }, { ...params });
      attachFile2 = await service.create({
        content,
        target,
        comment,
        stream_id: stream.id,
        secret: true,
        enabled: false,
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
    const res = await app.service('authentication').create(
      { ...uinfo, strategy: 'local' }, {},
    );
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

    const buf = randomBytes(32);
    content = buf.toString('base64');
  });

  afterAll(async () => {
    await db('streams').del();
    await db('users').del();
  });
});
