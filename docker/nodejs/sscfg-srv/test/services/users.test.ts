/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import {
  BadRequest, Conflict, MethodNotAllowed, NotFound,
} from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { Knex } from 'knex';
import app from '../../src/app';
import { Users } from '../../src/models/users.model';

describe('\'users\' service', () => {
  let db: Knex;
  let admin: Users;
  const test = { jest: true };

  const adminInfo = {
    name: 'admin@example.com',
    systemAdmin: true,
  };

  const userInfo = {
    name: 'user00',
    password: 'password-00',
    email: 'user00@example.org',
    displayName: 'display name',
  };

  it('registered the service', () => {
    const service = app.service('users');
    expect(service).toBeTruthy();
  });

  describe('システム管理者による操作', () => {
    const service = app.service('users');
    let params: Params;

    describe('ユーザ登録', () => {
      it('通常のプロパティを指定してユーザを登録する', async () => {
        expect.assertions(10);
        const user = await service.create(userInfo, params);
        expect(user.id).not.toBeNull();
        expect(user.name).toBe(userInfo.name);
        expect(user.email).toBe(userInfo.email);
        expect(user.displayName).toBe(userInfo.displayName);
        expect(user.createdAt).not.toBeNull();
        expect(user.updatedAt).not.toBeNull();
        expect(user.systemAdmin).toBe(false);
        expect(user.avatar).not.toBeNull();
        expect(user.isLocalUser).toBeTruthy();
        expect(user.password).toBeUndefined();
      });

      it('名前とパスワードを指定してユーザを登録する', async () => {
        expect.assertions(10);
        const user = await service.create({
          name: userInfo.name,
          password: userInfo.password,
        }, params);
        expect(user.id).not.toBeNull();
        expect(user.name).toBe(userInfo.name);
        expect(user.email).toBeNull();
        expect(user.displayName).toBeNull();
        expect(user.createdAt).not.toBeNull();
        expect(user.updatedAt).not.toBeNull();
        expect(user.systemAdmin).toBe(false);
        expect(user.avatar).not.toBeNull();
        expect(user.isLocalUser).toBeTruthy();
        expect(user.password).toBeUndefined();
      });

      it('重複した名前をもつユーザを登録することは出来ない', async () => {
        expect.assertions(1);
        await service.create(userInfo, params);
        await expect(async () => {
          await service.create(userInfo, params);
        }).rejects.toThrowError(Conflict);
      });

      it('名前の指定がないユーザを登録することは出来ない', async () => {
        expect.assertions(1);
        const { name: _, ...userInfo0 } = userInfo;
        await expect(async () => {
          await service.create(userInfo0, params);
        }).rejects.toThrowError(BadRequest);
      });
    });

    describe('登録されているユーザに対する操作', () => {
      let user0: Users;

      describe('ユーザ情報更新', () => {
        it('メールアドレスの変更', async () => {
          expect.assertions(4);
          const email = 'new-user00@example.org';
          const user1 = await service.patch(user0.id, { email }, params);
          const {
            email: _, avatar: avatar0, updatedAt: updatedAt0, ...userParams0
          } = user0;
          const {
            email: email1, avatar: avatar1, updatedAt: updatedAt1, ...userParams1
          } = user1;
          expect(email1).toBe(email);
          expect(avatar1).not.toBe(avatar0);
          expect(updatedAt1).not.toBe(updatedAt0);
          expect(userParams1).toEqual(userParams0);
        });

        it('表示名の変更', async () => {
          expect.assertions(3);
          const displayName = 'new name';
          const user1 = await service.patch(user0.id, { displayName }, params);
          const { displayName: _, updatedAt: updatedAt0, ...userParams0 } = user0;
          const { displayName: displayName1, updatedAt: updatedAt1, ...userParams1 } = user1;
          expect(displayName1).toBe(displayName);
          expect(updatedAt1).not.toBe(updatedAt0);
          expect(userParams1).toEqual(userParams0);
        });

        it('名前は変更できない', async () => {
          expect.assertions(1);
          const name = 'new-name';
          await expect(async () => {
            await service.patch(user0.id, { name }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('パスワードの変更', async () => {
          expect.assertions(2);
          const password = 'new-password';
          const user1 = await service.patch(user0.id, { password }, { ...params });
          const { updatedAt: updatedAt0, ...userParams0 } = user0;
          const { updatedAt: updatedAt1, ...userParams1 } = user1;
          expect(updatedAt1).not.toBe(updatedAt0);
          expect(userParams1).toEqual(userParams0);
        });

        describe('システム管理者権限', () => {
          it('システム管理者権限を付与する', async () => {
            expect.assertions(3);
            const systemAdmin = true;
            const user1 = await service.patch(user0.id, { systemAdmin }, params);
            const { systemAdmin: _, updatedAt: updatedAt0, ...userParams0 } = user0;
            const { systemAdmin: systemAdmin1, updatedAt: updatedAt1, ...userParams1 } = user1;
            expect(systemAdmin1).toBe(systemAdmin);
            expect(updatedAt1).not.toBe(updatedAt0);
            expect(userParams1).toEqual(userParams0);
          });

          it('自身のシステム管理者権限は変更できない', async () => {
            expect.assertions(1);
            const systemAdmin = false;
            await expect(async () => {
              await service.patch(admin.id, { systemAdmin }, params);
            }).rejects.toThrowError(BadRequest);
          });
        });

        it('PUTでユーザ情報を更新することはできない', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.update(user0.id, userInfo, params);
          }).rejects.toThrowError(MethodNotAllowed);
        });
      });

      describe('ユーザの削除', () => {
        it('削除実行', async () => {
          expect.assertions(1);
          const res = await service.remove(user0.id, { ...params });
          expect(res.deleted).toBe(true);
        });

        it('自分自身は削除できない', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.remove(admin.id, params);
          }).rejects.toThrowError(MethodNotAllowed);
        });

        describe('ユーザ取得', () => {
          it('ユーザ名で検索する', async () => {
            expect.assertions(1);
            const query = { name: user0.name };
            const users = await service.find({ ...params, query });
            if (users instanceof Array) {
              expect(users.length).toBe(0);
            }
          });

          it('削除したユーザは取得できないこと', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.get(user0.id, params);
            }).rejects.toThrowError(NotFound);
          });

          beforeEach(async () => {
            await service.remove(user0.id, { ...params });
          });
        });
      });

      it('ユーザ取得', async () => {
        expect.assertions(1);
        const user = await service.get(user0.id, params);
        expect(user).toEqual(user0);
      });

      describe('ユーザ検索', () => {
        it('ユーザ一覧取得', async () => {
          expect.assertions(3);
          const users = await service.find(params);
          if (users instanceof Array) {
            expect(users.length).toBe(2);
            expect(users).toContainEqual(admin);
            expect(users).toContainEqual(user0);
          }
        });

        it('ユーザ名で検索する', async () => {
          expect.assertions(2);
          const query = { name: user0.name };
          const users = await service.find({ ...params, query });
          if (users instanceof Array) {
            expect(users.length).toBe(1);
            expect(users).toContainEqual(user0);
          }
        });

        it('ユーザ名候補で検索する', async () => {
          expect.assertions(2);
          const query = { name: { $in: [user0.name] } };
          const users = await service.find({ ...params, query });
          if (users instanceof Array) {
            expect(users.length).toBe(1);
            expect(users).toContainEqual(user0);
          }
        });

        it('メールアドレスで検索する', async () => {
          expect.assertions(2);
          const query = { email: user0.email };
          const users = await service.find({ ...params, query });
          if (users instanceof Array) {
            expect(users.length).toBe(1);
            expect(users).toContainEqual(user0);
          }
        });

        it('表示名で検索する', async () => {
          expect.assertions(2);
          const query = { displayName: user0.displayName };
          const users = await service.find({ ...params, query });
          if (users instanceof Array) {
            expect(users.length).toBe(1);
            expect(users).toContainEqual(user0);
          }
        });

        it('システム管理者権限で検索する', async () => {
          expect.assertions(2);
          const query = { systemAdmin: false };
          const users = await service.find({ ...params, query });
          if (users instanceof Array) {
            expect(users.length).toBe(1);
            expect(users).toContainEqual(user0);
          }
        });
      });

      beforeEach(async () => {
        try {
          const vault = app.service('sys-vault');
          await vault.remove(`auth/userpass/users/${userInfo.name}`);
          // eslint-disable-next-line no-empty
        } catch (e) {}
        user0 = await service.create(userInfo, { user: admin });
      });
    });

    beforeEach(() => {
      params = { user: admin, test };
    });
  });

  describe('一般ユーザによる操作', () => {
    const service = app.service('users');
    let params: Params;
    let user: Users;
    const userInfo1 = {
      name: 'user01',
      password: 'password-01',
      email: 'user01@example.org',
      displayName: 'display name 01',
    };

    describe('許可されていない操作', () => {
      it('ユーザ登録', async () => {
        expect.assertions(1);
        await expect(async () => {
          await service.create(userInfo1, params);
        }).rejects.toThrowError(MethodNotAllowed);
      });

      describe('登録されているユーザに対する操作', () => {
        let user1: Users;
        describe('ユーザ削除', () => {
          it('自分自身を削除する', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.remove(user.id, params);
            }).rejects.toThrowError(MethodNotAllowed);
          });

          it('他のユーザを削除する', async () => {
            expect.assertions(1);
            await expect(async () => {
              await service.remove(user1.id, params);
            }).rejects.toThrowError(MethodNotAllowed);
          });
        });

        it('PUTでユーザ情報を更新することはできない', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.update(user1.id, userInfo, params);
          }).rejects.toThrowError(MethodNotAllowed);
        });

        describe('他のユーザ情報を更新する', () => {
          it('メールアドレスの変更', async () => {
            expect.assertions(1);
            const email = 'new-user01@example.org';
            await expect(async () => {
              await service.patch(user1.id, { email }, params);
            }).rejects.toThrowError(NotFound);
          });
          it('表示名の変更', async () => {
            expect.assertions(1);
            const displayName = 'new name';
            await expect(async () => {
              await service.patch(user1.id, { displayName }, params);
            }).rejects.toThrowError(NotFound);
          });

          it('名前の変更', async () => {
            expect.assertions(1);
            const name = 'new-name';
            await expect(async () => {
              await service.patch(user1.id, { name }, params);
            }).rejects.toThrowError(BadRequest);
          });

          it('パスワードの変更', async () => {
            expect.assertions(1);
            const currentPassword = userInfo1.password;
            const password = 'new-password';
            await expect(async () => {
              await service.patch(user1.id, { password, currentPassword }, params);
            }).rejects.toThrowError(NotFound);
          });

          it('システム管理者権限の変更', async () => {
            expect.assertions(1);
            const systemAdmin = true;
            await expect(async () => {
              await service.patch(user1.id, { systemAdmin }, params);
            }).rejects.toThrowError(BadRequest);
          });
        });

        beforeEach(async () => {
          user1 = await service.create(userInfo1, { user: admin, test });
        });
      });
    });

    describe('自分自身に対する操作', () => {
      it('メールアドレスの変更', async () => {
        expect.assertions(4);
        const email = 'new-user01@example.org';
        const user1 = await service.patch(user.id, { email }, params);
        const {
          email: _, avatar: avatar0, updatedAt: updatedAt0, ...userParams0
        } = user;
        const {
          email: email1, avatar: avatar1, updatedAt: updatedAt1, ...userParams1
        } = user1;
        expect(email1).toBe(email);
        expect(avatar1).not.toBe(avatar0);
        expect(updatedAt1).not.toBe(updatedAt0);
        expect(userParams1).toEqual(userParams0);
      });

      it('表示名の変更', async () => {
        expect.assertions(3);
        const displayName = 'new name';
        const user1 = await service.patch(user.id, { displayName }, params);
        const { displayName: _, updatedAt: updatedAt0, ...userParams0 } = user;
        const { displayName: displayName1, updatedAt: updatedAt1, ...userParams1 } = user1;
        expect(displayName1).toBe(displayName);
        expect(updatedAt1).not.toBe(updatedAt0);
        expect(userParams1).toEqual(userParams0);
      });

      it('名前は変更できない', async () => {
        expect.assertions(1);
        const name = 'new-name';
        await expect(async () => {
          await service.patch(user.id, { name }, params);
        }).rejects.toThrowError(BadRequest);
      });

      it('システム管理者権限は変更できない', async () => {
        expect.assertions(1);
        const systemAdmin = true;
        await expect(async () => {
          await service.patch(user.id, { systemAdmin }, params);
        }).rejects.toThrowError(BadRequest);
      });

      describe('パスワードの変更', () => {
        it('変更前パスワードを指定する', async () => {
          expect.assertions(2);
          const currentPassword = userInfo.password;
          const password = 'new-password';
          const user1 = await service.patch(user.id, { password, currentPassword }, params);
          const { password: _pass0, updatedAt: updatedAt0, ...userParams0 } = user;
          const { password: _pass1, updatedAt: updatedAt1, ...userParams1 } = user1;
          expect(updatedAt1).not.toBe(updatedAt0);
          expect(userParams1).toEqual(userParams0);
        });

        it('変更前パスワードを指定しない', async () => {
          expect.assertions(1);
          const password = 'new-password';
          await expect(async () => {
            await service.patch(user.id, { password }, params);
          }).rejects.toThrowError(BadRequest);
        });

        it('変更前パスワードが正しくない', async () => {
          expect.assertions(1);
          const currentPassword = 'bad-password';
          const password = 'new-password';
          await expect(async () => {
            await service.patch(user.id, { password, currentPassword }, params);
          }).rejects.toThrowError(BadRequest);
        });
      });
    });

    describe('ユーザ情報の取得', () => {
      let user1: Users;

      describe('ユーザ取得', () => {
        it('自身のユーザ情報取得', async () => {
          expect.assertions(1);
          const res = await service.get(user.id, params);
          expect(res).toEqual(user);
        });

        it('他のユーザ情報取得', async () => {
          expect.assertions(1);
          const res = await service.get(user1.id, params);
          expect(res).toEqual(user1);
        });
      });

      describe('ユーザ検索', () => {
        it('ユーザ一覧取得', async () => {
          expect.assertions(1);
          await expect(async () => {
            await service.find({ ...params });
          }).rejects.toThrowError(MethodNotAllowed);
        });

        it('ユーザ名で検索する', async () => {
          expect.assertions(2);
          const query = { name: user1.name };
          const users = await service.find({ ...params, query });
          if (users instanceof Array) {
            expect(users.length).toBe(1);
            expect(users).toContainEqual(user1);
          }
        });

        it('ユーザ名候補で検索する', async () => {
          expect.assertions(2);
          const query = { name: { $in: [user1.name] } };
          const users = await service.find({ ...params, query });
          if (users instanceof Array) {
            expect(users.length).toBe(1);
            expect(users).toContainEqual(user1);
          }
        });

        it('メールアドレスで検索する', async () => {
          expect.assertions(1);
          const query = { email: user1.email };
          await expect(async () => {
            await service.find({ ...params, query });
          }).rejects.toThrowError(MethodNotAllowed);
        });

        it('表示名で検索する', async () => {
          expect.assertions(1);
          const query = { displayName: user1.displayName };
          await expect(async () => {
            await service.find({ ...params, query });
          }).rejects.toThrowError(MethodNotAllowed);
        });

        it('システム管理者権限で検索する', async () => {
          expect.assertions(1);
          const query = { systemAdmin: false };
          await expect(async () => {
            await service.find({ ...params, query });
          }).rejects.toThrowError(MethodNotAllowed);
        });
      });

      beforeEach(async () => {
        user1 = await service.create(userInfo1, { user: admin, test });
      });
    });

    beforeEach(async () => {
      user = await service.create(userInfo, { user: admin, test });
      params = { user, test };
    });
  });

  beforeEach(async () => {
    await db('users').del();
    await db('users').insert(adminInfo);
    [admin] = ((await app.service('users').find({ query: { name: adminInfo.name } })) as Users[]);
  });

  afterEach(async () => {
    await db('users').del();
  });

  beforeAll(async () => {
    db = app.get('knex');
  });
});
