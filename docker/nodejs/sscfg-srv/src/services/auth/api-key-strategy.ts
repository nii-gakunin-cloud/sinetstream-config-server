import { AuthenticationBaseStrategy, AuthenticationRequest, AuthenticationResult } from '@feathersjs/authentication';
import { GeneralError, NotAuthenticated } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';

interface AppRole {
  roleId: string;
  secretId: string;
}

interface AppRoleInfo {
  appRole: AppRole;
  accessKeyId: number;
}

export class ApiKeyStrategy extends AuthenticationBaseStrategy {
  get configuration(): any {
    const authConfig = this.authentication?.configuration;
    const config = super.configuration || {};
    return {
      service: authConfig.service,
      entity: authConfig.entity,
      entityId: authConfig.entityId,
      ...config,
    };
  }

  get vaultToken(): string {
    const { token } = this.app?.get('hashicorpVault') || {};
    return token;
  }

  async getAppRole(
    user: Record<string, any>,
    secretId: string,
    params: Params,
  ): Promise<AppRoleInfo> {
    const accessKeyService = this.app?.service('access-keys');
    if (accessKeyService == null) {
      throw new GeneralError();
    }
    const accessKeys = await accessKeyService.find({
      ...params,
      user,
      vaultToken: this.vaultToken,
      query: { user_id: user.id },
      paginate: false,
    });
    if (!Array.isArray(accessKeys)) {
      throw new GeneralError();
    }
    const matchKey = accessKeys.filter((x) => x.secretId === secretId && x.user_id === user.id);
    if (matchKey.length > 1) {
      throw new GeneralError();
    } else if (matchKey.length === 0) {
      throw new NotAuthenticated();
    }
    return {
      appRole: {
        roleId: matchKey[0].roleId,
        secretId,
      },
      accessKeyId: matchKey[0].id,
    };
  }

  async login(appRole: AppRole): Promise<string> {
    const service = this.app?.service('sys-vault');
    const { client_token: token } = await service.create({
      path: 'auth/approle/login',
      role_id: appRole.roleId,
      secret_id: appRole.secretId,
    }, { query: { $select: 'auth' } });
    return token;
  }

  async findEntity(username: string): Promise<any> {
    if (!username) {
      throw new NotAuthenticated();
    }

    const query = {
      name: username,
      $limit: 1,
    };
    const { entityService } = this;
    const result = await entityService.find({ query });
    const [entity = null] = Array.isArray(result) ? result : result.data;
    if (entity == null) {
      throw new NotAuthenticated();
    }
    return entity;
  }

  async authenticate(data: AuthenticationRequest, params: Params): Promise<AuthenticationResult> {
    const { entity } = this.configuration;
    const { user: username, 'secret-key': secretId } = data;
    const user = await this.findEntity(username);
    const { appRole, accessKeyId } = await this.getAppRole(user, secretId, params);
    const vaultToken = await this.login(appRole);
    return {
      authentication: { strategy: this.name, vaultToken, accessKeyId },
      [entity]: user,
    };
  }
}
