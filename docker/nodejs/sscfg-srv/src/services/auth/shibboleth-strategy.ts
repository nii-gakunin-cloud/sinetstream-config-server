import { AuthenticationBaseStrategy, AuthenticationRequest, AuthenticationResult } from '@feathersjs/authentication';
import { NotAuthenticated, NotFound } from '@feathersjs/errors';
import { Params, Service } from '@feathersjs/feathers';

interface AppRole {
  roleId: string;
  secretId: string;
}

interface UserInfo {
  eppn: string;
  approle: AppRole;
}

export class ShibbolethStrategy extends AuthenticationBaseStrategy {
  verifyConfiguration(): void {
    const config = this.configuration;
    ['usernameField', 'vaultPath'].forEach((prop) => {
      if (typeof config[prop] !== 'string') {
        throw new Error(`'${this.name}' authentication strategy requires a '${prop}' setting`);
      }
    });
  }

  get configuration(): any {
    const authConfig = this.authentication?.configuration;
    const config = super.configuration || {};
    return {
      service: authConfig.service,
      entity: authConfig.entity,
      entityId: authConfig.entityId,
      errorMessage: 'Invalid login',
      ...config,
    };
  }

  get vaultService(): Service<any> {
    return this.app?.service('sys-vault') || null;
  }

  async findEntity(name: string): Promise<any> {
    if (!name) {
      throw new NotAuthenticated();
    }
    const query = {
      [this.configuration.usernameField]: name,
      deleted: false,
      $limit: 1,
    };
    const { entityService } = this;
    try {
      const result = await entityService.find({ query });
      const [entity = null] = Array.isArray(result) ? result : result.data;
      return entity;
    } catch (e) {
      if (e instanceof NotFound) {
        return null;
      }
      throw e;
    }
  }

  async vaultLogin(appRole: AppRole): Promise<string> {
    const { client_token: token } = await this.vaultService.create({
      path: 'auth/approle/login',
      role_id: appRole.roleId,
      secret_id: appRole.secretId,
    }, { query: { $select: 'auth' } });
    return token;
  }

  async getSecretId(token: string): Promise<string> {
    const { secret_id: secretId } = await this.vaultService.create({
      path: 'sys/wrapping/unwrap',
      token,
    });
    return secretId;
  }

  async getShibbolethParams(token: string): Promise<Record<string, string>> {
    const path = `${this.configuration.vaultPath}/${token}`;
    const ret = await this.vaultService.get(path);
    await this.vaultService.remove(path);
    return ret;
  }

  async getUserInfo(token: string): Promise<UserInfo> {
    const { eppn, roleId } = await this.getShibbolethParams(token);
    const secretId = await this.getSecretId(token);
    return {
      eppn,
      approle: { roleId, secretId },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async authenticate(data: AuthenticationRequest, params: Params): Promise<AuthenticationResult> {
    const { entity, errorMessage } = this.configuration;
    const { token: wrappingToken } = data;
    try {
      const { eppn, approle } = await this.getUserInfo(wrappingToken);
      const vaultToken = await this.vaultLogin(approle);
      const authEntity = await this.findEntity(eppn);
      return {
        authentication: { strategy: this.name, vaultToken },
        [entity]: authEntity,
      };
    } catch (e) {
      throw new NotAuthenticated(errorMessage);
    }
  }
}
