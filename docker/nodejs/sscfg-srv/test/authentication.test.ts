import { GeneralError, NotAuthenticated } from '@feathersjs/errors';
import { Knex } from 'knex';
import app from '../src/app';
import { Users } from '../src/models/users.model';

describe('authentication', () => {
  let db: Knex;
  const userInfo = {
    name: 'someone',
    password: 'supersecret',
  };
  let secretId: string;

  it('registered the authentication service', () => {
    expect(app.service('authentication')).toBeTruthy();
  });

  describe('local strategy', () => {
    it('authenticates user and creates accessToken', async () => {
      expect.assertions(2);
      const { user, accessToken } = await app.service('authentication').create({
        strategy: 'local',
        ...userInfo,
      }, {});
      expect(accessToken).toBeTruthy();
      expect(user).toBeTruthy();
    });

    it('パスワードに誤りがある場合', async () => {
      expect.assertions(1);
      await expect(async () => {
        await app.service('authentication').create({
          strategy: 'local',
          name: userInfo.name,
          password: `xxx${userInfo.password}`,
        }, {});
      }).rejects.toThrowError(NotAuthenticated);
    });

    it('パスワードが指定されていない場合', async () => {
      expect.assertions(1);
      await expect(async () => {
        await app.service('authentication').create({
          strategy: 'local',
          name: userInfo.name,
        }, {});
      }).rejects.toThrowError(NotAuthenticated);
    });

    it('ユーザ名が指定されていない場合', async () => {
      expect.assertions(1);
      await expect(async () => {
        await app.service('authentication').create({
          strategy: 'local',
          password: userInfo.password,
        }, {});
      }).rejects.toThrowError(NotAuthenticated);
    });
  });

  describe('shibboleth strategy', () => {
    const userInfo1 = {
      name: 'user01@idp.example.org',
      isLocalUser: false,
    };
    const vault = app.service('sys-vault');
    let policyName: string;
    let appRoleName: string;
    let roleId: string;
    let token: string;
    let user1: Users;

    it('認証OK', async () => {
      expect.assertions(2);
      const { accessToken, user } = await app.service('authentication').create({
        token,
        strategy: 'shibboleth',
      }, {});
      expect(accessToken).toBeTruthy();
      expect(user.name).toBe(userInfo1.name);
    });

    it('Wrapping Tokenに誤りがある場合', async () => {
      await expect(async () => {
        await app.service('authentication').create({
          token: `x${token}`,
          strategy: 'shibboleth',
        }, {});
      }).rejects.toThrowError(NotAuthenticated);
    });

    it('Wrapping Tokenが指定されてない場合', async () => {
      await expect(async () => {
        await app.service('authentication').create({
          strategy: 'shibboleth',
        }, {});
      }).rejects.toThrowError(NotAuthenticated);
    });

    const createSecretId = async (name: string): Promise<string> => {
      const path = `auth/approle/role/${name}/secret-id`;
      const headers = { 'X-Vault-Wrap-TTL': '3m' };
      const query = { $select: 'wrap_info' };
      const res = await vault.create({ path }, { headers, query });
      if (typeof res === 'string') {
        throw new GeneralError();
      }
      return res?.token;
    };

    const storeAppRoleInfo = async (wToken: string, name: string, rid: string): Promise<void> => {
      const path = `cubbyhole/sscfg/shibboleth/${wToken}`;
      const data = {
        path,
        eppn: name,
        roleId: rid,
      };
      await vault.create(data);
    };

    beforeEach(async () => {
      // Secret IDの取得(Wrapping Token)
      token = await createSecretId(appRoleName);
      // RoleId, name(ePPN)をVaultに格納(cubbyhole)
      await storeAppRoleInfo(token, userInfo1.name, roleId);
    });

    const createVaultPolicy = async (name: string): Promise<void> => {
      const { rootPath } = app.get('hashicorpVault');
      const policy = `
path "${rootPath}users/${user1.id}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "${rootPath}streams/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
      `;
      const vid = `sys/policy/${name}`;
      await vault.update(vid, { policy });
    };

    const createVaultAppRole = async (name: string, policy: string): Promise<void> => {
      const data = {
        secret_id_num_uses: 1,
        secret_id_ttl: '3m',
        token_policies: ['default', policy],
      };
      const vid = `auth/approle/role/${name}`;
      await vault.update(vid, data);
    };

    const getAppRoleId = async (name: string): Promise<string> => {
      const vid = `auth/approle/role/${name}/role-id`;
      const res = await vault.get(vid);
      if (typeof res === 'string') {
        throw new GeneralError();
      }
      return res?.role_id;
    };

    beforeAll(async () => {
      // ローカルでないユーザレコードの登録(users)
      await db('users').insert(userInfo1);
      [user1] = ((await app.service('users').find({ query: { name: userInfo1.name } })) as Users[]);
      // 対応するVaultポリシーの作成
      policyName = `user-${user1.id}`;
      await createVaultPolicy(policyName);
      // 対応するAppRoleの作成
      appRoleName = `shibboleth-${user1.id}`;
      await createVaultAppRole(appRoleName, policyName);
      // RoleIDの取得
      roleId = await getAppRoleId(appRoleName);
    });
  });

  describe('api key strategy', () => {
    it('認証OK', async () => {
      expect.assertions(2);
      const { user, accessToken } = await app.service('authentication').create({
        user: userInfo.name,
        'secret-key': secretId,
        strategy: 'api-access',
        ...userInfo,
      }, {});
      expect(accessToken).toBeTruthy();
      expect(user).toBeTruthy();
    });

    it('シークレットキーに誤りがある場合', async () => {
      expect.assertions(1);
      await expect(async () => {
        await app.service('authentication').create({
          user: userInfo.name,
          'secret-key': `xxx${secretId}`,
          strategy: 'api-access',
        }, {});
      }).rejects.toThrowError(NotAuthenticated);
    });

    it('シークレットキーが指定されていない場合', async () => {
      expect.assertions(1);
      await expect(async () => {
        await app.service('authentication').create({
          user: userInfo.name,
          strategy: 'api-access',
        }, {});
      }).rejects.toThrowError(NotAuthenticated);
    });

    it('ユーザ名が指定されていない場合', async () => {
      expect.assertions(1);
      await expect(async () => {
        await app.service('authentication').create({
          'secret-key': secretId,
          strategy: 'api-access',
        }, {});
      }).rejects.toThrowError(NotAuthenticated);
    });
  });

  const getAuthentication = async (uinfo: Record<string, string>): Promise<Record<string, any>> => {
    const res = await app.service('authentication').create({ ...uinfo, strategy: 'local' }, {});
    const { payload, accessToken } = res.authentication;
    return { strategy: 'jwt', accessToken, payload };
  };

  beforeAll(async () => {
    try {
      const vault = app.service('sys-vault');
      await vault.remove(`auth/userpass/users/${userInfo.name}`);
      // eslint-disable-next-line no-empty
    } catch (e) {}
    db = app.get('knex');
    await db('api_access_keys').del();
    await db('users').del();
    await db('users').insert({ name: 'admin', systemAdmin: true });
    const [admin] = ((await app.service('users').find({ query: { name: 'admin' } })) as Users[]);
    const user = await app.service('users').create(userInfo, { user: admin });
    const authentication = await getAuthentication(userInfo);
    const params = { user, authentication, test: { jest: true } };
    const accessKey = await app.service('access-keys').create({ allPermitted: true }, { ...params });
    secretId = accessKey.secretId;
  });

  afterAll(async () => {
    await db('api_access_keys').del();
    await db('users').del();
  });
});
