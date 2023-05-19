/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import {
  BadRequest, Forbidden, MethodNotAllowed, NotFound,
} from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { randomBytes } from 'crypto';
import { Knex } from 'knex';
import app from '../../src/app';
import { toVid } from '../../src/hooks/process-user-parameters';
import { Streams } from '../../src/models/streams.model';
import { UserParameters } from '../../src/models/user-parameters.model';
import { Users } from '../../src/models/users.model';

describe('\'user-parameters\' service', () => {
  let db: Knex;
  const service = app.service('user-parameters');
  const vault = app.service('vault');
  let user: Users;
  let user1: Users;
  let otherUser: Users;
  let stream: Streams;
  let params: Params;
  let paramsUser1: Params;
  let paramsOtherUser: Params;
  const target = '*.sasl_plain_password';
  const comment = 'comment';
  const streamName = 'config-001';
  const streamComment = 'config-001 comment';
  const content = randomBytes(32).toString('base64');
  const textContent = 'abcdefgh';
  let authentication: Record<string, any>;
  let authentication1: Record<string, any>;
  let authentication2: Record<string, any>;

  describe('ユーザパラメータの登録', () => {
    const testParams = [
      [true, 'content', content],
      [true, 'textContent', textContent],
      [false, 'content', content],
      [false, 'textContent', textContent],
    ];

    describe.each(testParams)('登録の実行: enabled=%p, %s', (enabled, key, value) => {
      describe('秘匿情報でない場合', () => {
        it('自身のパラメータ', async () => {
          expect.assertions(key === 'textContent' ? 15 : 14);
          const userParameter = await service.create({
            [key as string]: value,
            target,
            comment,
            stream_id: stream.id,
            user_id: user.id,
            enabled,
            secret: false,
          }, { ...params });
          expect(userParameter.id).not.toBeNull();
          expect(userParameter.secret).toBe(false);
          expect(userParameter.stream_id).toBe(stream.id);
          expect(userParameter.user_id).toBe(user.id);
          expect(userParameter.target).toBe(target);
          expect(userParameter.enabled).toBe(enabled);
          expect(userParameter.comment).toBe(comment);
          expect(userParameter.createdAt).not.toBeNull();
          expect(userParameter.updatedAt).not.toBeNull();
          expect(userParameter.createdUser).toBe(user.id);
          expect(userParameter.updatedUser).toBe(user.id);
          expect(userParameter.isBinary).toBe(key === 'content');
          expect(userParameter.content).toBeUndefined();
          if (key === 'textContent') {
            expect(userParameter.textContent).toBe(textContent);
          }

          // HashiCorp Vaultに添付ファイルが登録されていないことを確認する
          await expect(async () => {
            await vault.get(toVid(userParameter), { ...params });
          }).rejects.toThrowError(NotFound);
        });

        it('他ユーザのパラメータ', async () => {
          expect.assertions(key === 'textContent' ? 15 : 14);
          const userParameter = await service.create({
            [key as string]: value,
            target,
            comment,
            stream_id: stream.id,
            user_id: user1.id,
            enabled,
            secret: false,
          }, { ...params });
          expect(userParameter.id).not.toBeNull();
          expect(userParameter.secret).toBe(false);
          expect(userParameter.stream_id).toBe(stream.id);
          expect(userParameter.user_id).toBe(user1.id);
          expect(userParameter.target).toBe(target);
          expect(userParameter.enabled).toBe(enabled);
          expect(userParameter.comment).toBe(comment);
          expect(userParameter.createdAt).not.toBeNull();
          expect(userParameter.updatedAt).not.toBeNull();
          expect(userParameter.createdUser).toBe(user.id);
          expect(userParameter.updatedUser).toBe(user.id);
          expect(userParameter.isBinary).toBe(key === 'content');
          expect(userParameter.content).toBeUndefined();
          if (key === 'textContent') {
            expect(userParameter.textContent).toBe(textContent);
          }

          // HashiCorp Vaultに添付ファイルが登録されていないことを確認する
          await expect(async () => {
            await vault.get(toVid(userParameter), { ...params });
          }).rejects.toThrowError(NotFound);
        });
      });

      describe('秘匿情報の場合', () => {
        it('自身のパラメータ', async () => {
          expect.assertions(16);
          const userParameter = await service.create({
            [key as string]: value,
            target,
            comment,
            stream_id: stream.id,
            user_id: user.id,
            enabled,
            secret: true,
          }, { ...params });
          expect(userParameter.id).not.toBeNull();
          expect(userParameter.secret).toBe(true);
          expect(userParameter.stream_id).toBe(stream.id);
          expect(userParameter.user_id).toBe(user.id);
          expect(userParameter.target).toBe(target);
          expect(userParameter.enabled).toBe(enabled);
          expect(userParameter.comment).toBe(comment);
          expect(userParameter.createdAt).not.toBeNull();
          expect(userParameter.updatedAt).not.toBeNull();
          expect(userParameter.createdUser).toBe(user.id);
          expect(userParameter.updatedUser).toBe(user.id);
          expect(userParameter.isBinary).toBe(key === 'content');
          expect(userParameter.content).toBeUndefined();
          expect(userParameter.textContent).toBeUndefined();

          // HashiCorp Vaultにユーザパラメータが登録されてることを確認する
          const secret = await vault.get(toVid(userParameter), { ...params });
          expect(secret.size).toBe(key === 'content' ? 32 : 8);
          expect(secret.value).toBe(
            key === 'content'
              ? content : Buffer.from(textContent).toString('base64'),
          );
        });

        it('他ユーザのパラメータ', async () => {
          expect.assertions(16);
          const userParameter = await service.create({
            [key as string]: value,
            target,
            comment,
            stream_id: stream.id,
            user_id: user1.id,
            enabled,
            secret: true,
          }, { ...params });
          expect(userParameter.id).not.toBeNull();
          expect(userParameter.secret).toBe(true);
          expect(userParameter.stream_id).toBe(stream.id);
          expect(userParameter.user_id).toBe(user1.id);
          expect(userParameter.target).toBe(target);
          expect(userParameter.enabled).toBe(enabled);
          expect(userParameter.comment).toBe(comment);
          expect(userParameter.createdAt).not.toBeNull();
          expect(userParameter.updatedAt).not.toBeNull();
          expect(userParameter.createdUser).toBe(user.id);
          expect(userParameter.updatedUser).toBe(user.id);
          expect(userParameter.isBinary).toBe(key === 'content');
          expect(userParameter.content).toBeUndefined();
          expect(userParameter.textContent).toBeUndefined();

          // HashiCorp Vaultにユーザパラメータが登録されてることを確認する
          const secret = await vault.get(toVid(userParameter), { ...params });
          expect(secret.size).toBe(key === 'content' ? 32 : 8);
          expect(secret.value).toBe(
            key === 'content'
              ? content : Buffer.from(textContent).toString('base64'),
          );
        });
      });
    });

    describe('異常系', () => {
      describe('必須項目が指定されていない', () => {
        it('target', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              content,
              stream_id: stream.id,
              user_id: user.id,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('stream_id', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              content,
              target,
              user_id: user.id,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('user_id', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              content,
              target,
              stream_id: stream.id,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('content', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              target,
              stream_id: stream.id,
              user_id: user.id,
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
              stream_id: -1,
              user_id: user.id,
            }, params);
          }).rejects.toThrowError(Forbidden);
        });

        describe('user_id', () => {
          it('存在しないuser_id', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create({
                content,
                target,
                stream_id: stream.id,
                user_id: -1,
              }, params);
            }).rejects.toThrowError(BadRequest);
          });

          it('共同利用者でないuser_id', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.create({
                content,
                target,
                stream_id: stream.id,
                user_id: otherUser.id,
              }, params);
            }).rejects.toThrowError(BadRequest);
          });
        });

        it.each([' ', '*', '*..xxx', '*.xxx.*.xxx'])('正しくない書式のtarget指定', async (tgt) => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              content,
              target: tgt,
              stream_id: stream.id,
              user_id: otherUser.id,
            }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('content, textContentの両方を指定している', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.create({
              content,
              textContent,
              target,
              stream_id: stream.id,
              user_id: user.id,
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
                stream_id: stream.id,
                user_id: user.id,
              },
              { ...paramsOtherUser },
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
                stream_id: stream.id,
                user_id: user.id,
              },
              { ...paramsUser1 },
            );
          }).rejects.toThrowError(Forbidden);
        });
      });
    });
  });

  describe('ユーザパラメータの更新', () => {
    let userParameter0: UserParameters;

    describe.each([true, false])('項目の変更: enabled=%p', (enabled) => {
      it('comment', async () => {
        expect.assertions(3);
        const newComment = `new-${comment}`;
        const userParameter = await service.patch(
          userParameter0.id,
          { comment: newComment },
          { ...params },
        );
        const { comment: _comment, updatedAt: updatedAt0, ...params0 } = userParameter0;
        const { comment: comment1, updatedAt: updatedAt1, ...params1 } = userParameter;
        expect(comment1).toBe(newComment);
        expect(updatedAt1).not.toEqual(updatedAt0);
        expect(params1).toEqual(params0);
      });

      it('target', async () => {
        expect.assertions(3);
        const newTarget = `${target}.xxx`;
        const userParameter = await service.patch(
          userParameter0.id,
          { target: newTarget },
          { ...params },
        );
        const { target: _target, updatedAt: updatedAt0, ...params0 } = userParameter0;
        const { target: target1, updatedAt: updatedAt1, ...params1 } = userParameter;
        expect(target1).toBe(newTarget);
        expect(updatedAt1).not.toEqual(updatedAt0);
        expect(params1).toEqual(params0);
      });

      it('enabled', async () => {
        expect.assertions(3);
        const userParameter = await service.patch(
          userParameter0.id,
          { enabled: !enabled },
          { ...params },
        );
        const { enabled: _enabled, updatedAt: updatedAt0, ...params0 } = userParameter0;
        const { enabled: enabled1, updatedAt: updatedAt1, ...params1 } = userParameter;
        expect(enabled1).not.toBe(enabled);
        expect(updatedAt1).not.toEqual(updatedAt0);
        expect(params1).toEqual(params0);
      });

      beforeEach(async () => {
        userParameter0 = await service.create({
          textContent,
          target,
          comment,
          stream_id: stream.id,
          user_id: user.id,
          enabled,
          secret: false,
        }, { ...params });
      });
    });

    describe('content', () => {
      const testParams = [
        ['content', content, 'textContent', textContent],
        ['textContent', textContent, 'content', content],
      ];

      describe.each(testParams)('秘匿情報でない場合: %p', (key, value, okey, ovalue) => {
        it('変更の実行', async () => {
          expect.assertions(7);
          const userParameter = await service.patch(
            userParameter0.id,
            { [key]: value },
            { ...params },
          );
          const {
            isBinary: _isBinary, updatedAt: updatedAt0, textContent: _textContent0, ...params0
          } = userParameter0;
          const {
            isBinary: isBinary1, updatedAt: updatedAt1, textContent: textContent1, ...params1
          } = userParameter;
          expect(isBinary1).toBe(key === 'content');
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(params1).toEqual(params0);
          if (key === 'content') {
            expect(textContent1).toBeUndefined();
          } else {
            expect(textContent1).toBe(textContent);
          }

          // テーブルに記録されている content の値を確認する
          const ret = await db('user_parameters').where('id', userParameter0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content.toString('base64')).toBe(
            key === 'content' ? value : Buffer.from(value).toString('base64'),
          );

          // HashiCorp Vaultに登録されていないことを確認する
          await expect(async () => {
            await vault.get(toVid(userParameter), { ...params });
          }).rejects.toThrowError(NotFound);
        });

        beforeEach(async () => {
          userParameter0 = await service.create({
            [okey]: ovalue,
            target,
            comment,
            stream_id: stream.id,
            user_id: user.id,
            secret: false,
          }, { ...params });
        });
      });

      describe.each(testParams)('秘匿情報の変更: %p', (key, value, okey, ovalue) => {
        it('変更の実行', async () => {
          expect.assertions(8);
          const userParameter = await service.patch(
            userParameter0.id,
            { [key]: value },
            { ...params },
          );
          const { isBinary: _isBinary, updatedAt: updatedAt0, ...params0 } = userParameter0;
          const { isBinary: isBinary1, updatedAt: updatedAt1, ...params1 } = userParameter;
          expect(isBinary1).toBe(key === 'content');
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(params1).toEqual(params0);
          expect(params1.textContext).toBeUndefined();

          // テーブルに記録されている content の値を確認する
          const ret = await db('user_parameters').where('id', userParameter0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content).toBeNull();

          // HashiCorp Vaultに登録されていることを確認する
          const secret = await vault.get(toVid(userParameter), { ...params });
          expect(secret.size).toBe(key === 'content' ? 32 : 8);
          expect(secret.value).toBe(
            key === 'content'
              ? content : Buffer.from(textContent).toString('base64'),
          );
        });

        beforeEach(async () => {
          userParameter0 = await service.create({
            [okey]: ovalue,
            target,
            comment,
            stream_id: stream.id,
            user_id: user.id,
            secret: true,
          }, { ...params });
        });
      });
    });

    describe.each([true, false])('secret=%p', (beforeSecret) => {
      const newContent = randomBytes(32).toString('base64');

      describe('contentを指定しない場合', () => {
        it('secret=false', async () => {
          expect.assertions(6);
          const userParameter = await service.patch(
            userParameter0.id,
            { secret: false },
            { ...params },
          );
          const { secret: _secret, updatedAt: updatedAt0, ...params0 } = userParameter0;
          const { secret: secret1, updatedAt: updatedAt1, ...params1 } = userParameter;
          expect(secret1).toBe(false);
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(params1).toEqual(params0);

          // テーブルに記録されている content の値を確認する
          const ret = await db('user_parameters').where('id', userParameter0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content.toString('base64')).toBe(content);

          // HashiCorp Vaultに添付ファイルが登録されていないことを確認する
          await expect(async () => {
            await vault.get(toVid(userParameter), { ...params });
          }).rejects.toThrowError(NotFound);
        });

        it('secret=true', async () => {
          expect.assertions(7);
          const userParameter = await service.patch(
            userParameter0.id,
            { secret: true },
            { ...params },
          );
          const { secret: _secret, updatedAt: updatedAt0, ...params0 } = userParameter0;
          const { secret: secret1, updatedAt: updatedAt1, ...params1 } = userParameter;
          expect(secret1).toBe(true);
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(params1).toEqual(params0);

          // テーブルにcontentが記録されてないことを確認する
          const ret = await db('user_parameters').where('id', userParameter0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content).toBeNull();

          // HashiCorp Vaultに添付ファイルが登録されていることを確認する
          const secret = await vault.get(toVid(userParameter), { ...params });
          expect(secret.size).toBe(32);
          expect(secret.value).toBe(content);
        });
      });

      describe('contentを指定する場合', () => {
        it('secret=false', async () => {
          expect.assertions(6);
          const userParameter = await service.patch(
            userParameter0.id,
            { secret: false, content: newContent },
            { ...params },
          );
          const { secret: _secret, updatedAt: updatedAt0, ...params0 } = userParameter0;
          const { secret: secret1, updatedAt: updatedAt1, ...params1 } = userParameter;
          expect(secret1).toBe(false);
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(params1).toEqual(params0);

          // テーブルに記録されている content の値を確認する
          const ret = await db('user_parameters').where('id', userParameter0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content.toString('base64')).toBe(newContent);

          // HashiCorp Vaultに添付ファイルが登録されていないことを確認する
          await expect(async () => {
            await vault.get(toVid(userParameter), { ...params });
          }).rejects.toThrowError(NotFound);
        });

        it('secret=true', async () => {
          expect.assertions(7);
          const userParameter = await service.patch(
            userParameter0.id,
            { secret: true, content: newContent },
            { ...params },
          );
          const { secret: _secret, updatedAt: updatedAt0, ...params0 } = userParameter0;
          const { secret: secret1, updatedAt: updatedAt1, ...params1 } = userParameter;
          expect(secret1).toBe(true);
          expect(updatedAt1).not.toEqual(updatedAt0);
          expect(params1).toEqual(params0);

          // テーブルにcontentが記録されてないことを確認する
          const ret = await db('user_parameters').where('id', userParameter0.id).select('content');
          expect(ret.length).toBe(1);
          expect(ret[0].content).toBeNull();

          // HashiCorp Vaultに添付ファイルが登録されていることを確認する
          const secret = await vault.get(toVid(userParameter), { ...params });
          expect(secret.size).toBe(32);
          expect(secret.value).toBe(newContent);
        });
      });

      beforeEach(async () => {
        userParameter0 = await service.create({
          content,
          target,
          comment,
          stream_id: stream.id,
          user_id: user.id,
          secret: beforeSecret,
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
              await service.patch(userParameter0.id, { stream_id: stream1.id }, params);
            }).rejects.toThrowError(BadRequest);
          });

          beforeEach(async () => {
            const name = 'config-002';
            stream1 = await app.service('streams').create({ name }, { ...params });
          });
        });

        it('user_id', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(userParameter0.id, { user_id: user1.id }, params);
          }).rejects.toThrowError(BadRequest);
        });
      });

      describe('妥当でないパラメータの指定', () => {
        it.each([' ', '*', '*..xxx', '*.xxx.*.xxx'])('正しくない書式のtarget指定', async (tgt) => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(userParameter0.id, { target: tgt }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('content, textContentの両方を指定している', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(
              userParameter0.id,
              { content, textContent },
              params,
            );
          }).rejects.toThrowError(BadRequest);
        });
      });

      describe('権限のない利用者による更新', () => {
        it('共同利用者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(
              userParameter0.id,
              { enabled: false },
              { ...paramsOtherUser },
            );
          }).rejects.toThrowError(Forbidden);
        });

        it('データ管理者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.patch(
              userParameter0.id,
              { enabled: false },
              { ...paramsUser1 },
            );
          }).rejects.toThrowError(Forbidden);
        });
      });

      it('PUTによる更新', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.update(
            userParameter0.id,
            {
              content,
              target,
              stream_id: stream.id,
              user_id: user.id,
              secret: true,
            },
            params,
          );
        }).rejects.toThrowError(MethodNotAllowed);
      });

      beforeEach(async () => {
        userParameter0 = await service.create({
          content,
          target,
          stream_id: stream.id,
          user_id: user.id,
        }, { ...params });
      });
    });
  });

  describe('ユーザパラメータを削除する', () => {
    let userParameter0: UserParameters;

    describe.each([true, false])('添付ファイルの削除: secret=%p', (secret) => {
      it('削除の実行', async () => {
        expect.assertions(2);
        const res = await service.remove(userParameter0.id, { ...params });
        expect(res).toBeTruthy();

        // HashiCorp Vaultに登録されていないことを確認する
        await expect(async () => {
          await vault.get(toVid(userParameter0), { ...params });
        }).rejects.toThrowError(NotFound);
      });

      beforeEach(async () => {
        userParameter0 = await service.create({
          content,
          target,
          stream_id: stream.id,
          user_id: user.id,
          secret,
        }, { ...params });
      });
    });

    describe.each([true, false])('コンフィグ情報の削除にあわせて削除されること: %p', (secret) => {
      let stream1: Streams;

      it('コンフィグ情報の削除', async () => {
        expect.assertions(2);
        await app.service('streams').remove(stream1.id, { ...params });

        // user-parametersレコードが削除されていること
        const ret = await db('user_parameters').where('id', userParameter0.id);
        expect(ret.length).toBe(0);

        // HashiCorp Vaultに登録されていないことを確認する
        await expect(async () => {
          await vault.get(toVid(userParameter0), { ...params });
        }).rejects.toThrowError(NotFound);
      });

      beforeEach(async () => {
        const name = 'config-002';
        stream1 = await app.service('streams').create({ name }, { ...params });
        userParameter0 = await service.create({
          content,
          target,
          stream_id: stream1.id,
          user_id: user.id,
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
              userParameter0.id,
              { ...paramsOtherUser },
            );
          }).rejects.toThrowError(Forbidden);
        });

        it('データ管理者でない利用者', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.remove(
              userParameter0.id,
              { ...paramsUser1 },
            );
          }).rejects.toThrowError(Forbidden);
        });
      });

      beforeEach(async () => {
        userParameter0 = await service.create({
          content,
          target,
          stream_id: stream.id,
          user_id: user.id,
        }, { ...params });
      });
    });
  });

  describe.each([true, false])('ユーザパラメータを取得する: secret=%p', (secret) => {
    let userParameter0: UserParameters;

    it('取得の実行', async () => {
      expect.assertions(2);
      const res = await service.get(userParameter0.id, params);
      expect(res).toEqual(userParameter0);
      expect(res.content).toBeUndefined();
    });

    describe('joinEager', () => {
      it('stream', async () => {
        expect.assertions(2);
        const query = { $joinEager: 'stream' };
        const res = await service.get(userParameter0.id, { ...params, query });
        const { stream: stream1, ...userParameter1 } = res;
        expect(userParameter1).toEqual(userParameter0);
        expect(stream1).toEqual({ name: streamName, comment: streamComment });
      });

      it('user', async () => {
        expect.assertions(3);
        const query = { $joinEager: 'user' };
        const res = await service.get(userParameter0.id, { ...params, query });
        const { user: relUser, ...userParameter1 } = res;
        expect(userParameter1).toEqual(userParameter0);
        expect(relUser.name).toBe(user.name);
        expect(relUser.displayName).not.toBeNull();
      });
    });

    describe('権限のない利用者による取得', () => {
      it('共同利用者でない利用者', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(
            userParameter0.id,
            { ...paramsOtherUser },
          );
        }).rejects.toThrowError(NotFound);
      });

      it('データ管理者でない利用者', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.get(
            userParameter0.id,
            { ...paramsUser1 },
          );
        }).rejects.toThrowError(NotFound);
      });
    });

    beforeEach(async () => {
      userParameter0 = await service.create({
        content,
        target,
        stream_id: stream.id,
        user_id: user.id,
        secret,
      }, { ...params });
    });
  });

  describe('ユーザパラメータを検索する', () => {
    let userParameter0: UserParameters;
    let userParameter1: UserParameters;
    let userParameter2: UserParameters;

    it('全ての取得', async () => {
      expect.assertions(4);
      const res = await service.find(params);
      if (res instanceof Array) {
        expect(res.length).toBe(3);
        expect(res).toContainEqual(userParameter2);
        expect(res).toContainEqual(userParameter1);
        expect(res).toContainEqual(userParameter0);
      }
    });

    it('検索条件の指定', async () => {
      expect.assertions(3);
      const query = { enabled: true };
      const res = await service.find({ ...params, query });
      if (res instanceof Array) {
        expect(res.length).toBe(2);
        expect(res).toContainEqual(userParameter1);
        expect(res).toContainEqual(userParameter0);
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
        expect.assertions(5);
        const query = { $joinEager: 'user', user_id: user.id };
        const res = await service.find({ ...params, query });
        if (res instanceof Array) {
          expect(res.length).toBe(2);
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
          { ...paramsOtherUser },
        );
        if (res instanceof Array) {
          expect(res.length).toBe(0);
        }
      });

      it('データ管理者でない利用者', async () => {
        expect.assertions(1);
        const res = await service.find(
          { ...paramsUser1 },
        );
        if (res instanceof Array) {
          expect(res.length).toBe(0);
        }
      });
    });

    beforeEach(async () => {
      userParameter0 = await service.create({
        content,
        target,
        stream_id: stream.id,
        user_id: user.id,
        secret: false,
      }, { ...params });
      userParameter1 = await service.create({
        content,
        target,
        stream_id: stream.id,
        user_id: user1.id,
        secret: true,
      }, { ...params });
      userParameter2 = await service.create({
        content,
        target,
        stream_id: stream.id,
        user_id: user.id,
        secret: true,
        enabled: false,
      }, { ...params });
    });
  });

  beforeEach(async () => {
    await db('streams').del();
    const test = { jest: true };
    params = { user, authentication, test };
    paramsUser1 = { user: user1, authentication: authentication1, test };
    paramsOtherUser = { user: otherUser, authentication: authentication2, test };
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
