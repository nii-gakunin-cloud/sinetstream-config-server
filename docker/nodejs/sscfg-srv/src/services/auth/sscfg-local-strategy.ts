import { AuthenticationBaseStrategy, AuthenticationRequest, AuthenticationResult } from '@feathersjs/authentication';
import { NotAuthenticated } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';

export class SscfgLocalStrategy extends AuthenticationBaseStrategy {
  get configuration(): any {
    const authConfig = this.authentication?.configuration;
    const config = super.configuration || {};
    return {
      service: authConfig.service,
      entity: authConfig.entity,
      entityId: authConfig.entityId,
      errorMessage: 'Invalid login',
      entityUsernameField: config.usernameField,
      ...config,
    };
  }

  async login(username: string, password: string): Promise<string> {
    const { errorMessage } = this.configuration;
    const service = this.app?.service('sys-vault');
    try {
      const ret = await service.create({
        path: `auth/userpass/login/${username}`,
        password,
      }, { query: { $select: 'auth' } });
      const { client_token: token } = ret;
      return token;
    } catch (e) {
      throw new NotAuthenticated(errorMessage);
    }
  }

  async findEntity(username: string): Promise<any> {
    if (!username) {
      throw new NotAuthenticated();
    }
    const query = {
      [this.configuration.usernameField]: username,
      deleted: false,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async authenticate(data: AuthenticationRequest, params: Params): Promise<AuthenticationResult> {
    const { usernameField, entity } = this.configuration;
    const { [usernameField]: username, password } = data;
    const user = await this.findEntity(username);
    const vaultToken = await this.login(username, password);
    return {
      authentication: { strategy: this.name, vaultToken },
      [entity]: user,
    };
  }
}
