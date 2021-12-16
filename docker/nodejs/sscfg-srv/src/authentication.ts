import {
  AuthenticationRequest, AuthenticationResult, AuthenticationService, JWTStrategy,
} from '@feathersjs/authentication';
import { NotAuthenticated } from '@feathersjs/errors';
import { Params, ServiceAddons } from '@feathersjs/feathers';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import jsonwebtoken from 'jsonwebtoken';
import merge from 'lodash/merge';
import ms from 'ms';
import { Application } from './declarations';
import { ApiKeyStrategy } from './services/auth/api-key-strategy';
import { ShibbolethStrategy } from './services/auth/shibboleth-strategy';
import { SscfgLocalStrategy } from './services/auth/sscfg-local-strategy';
import { contentSchema } from './services/docs';

declare module './declarations' {
  interface ServiceTypes {
    'authentication': AuthenticationService & ServiceAddons<any>;
  }
}

const docs: ServiceSwaggerOptions = {
  idType: 'string',
  idNames: { remove: 'token' },
  operations: {
    create: {
      description: 'ログイン',
      'responses.201': {
        ...contentSchema({ $ref: '#/components/schemas/authentication_v1_response' }),
      },
    },
    remove: {
      description: 'ログアウト',
      parameters: [
        {
          name: 'token',
          description: 'ログアウト対象のアクセストークン(JWT)',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      'responses.200': {
        ...contentSchema({ $ref: '#/components/schemas/authentication_v1_response' }),
      },
    },
  },
  securities: ['remove'],
  definitions: {
    authentication_v1: {
      type: 'object',
      required: ['user', 'secret-key', 'strategy'],
      properties: {
        user: {
          type: 'string',
          description: 'ユーザ名',
        },
        'secret-key': {
          type: 'string',
          description: 'APIアクセスキー',
        },
        strategy: {
          type: 'string',
          enum: ['api-access'],
        },
      },
    },
    authentication_v1_response: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'アクセストークン(JWT)',
        },
        authentication: {
          type: 'object',
          properties: {
            strategy: {
              type: 'string',
            },
            accessToken: {
              type: 'string',
            },
            payload: {
              type: 'object',
              properties: {
                iat: {
                  type: 'integer',
                  description: 'JWTの発行日時',
                },
                exp: {
                  type: 'integer',
                  description: 'JWTの有効期限',
                },
                aud: {
                  type: 'string',
                  description: 'JWTの受け取り手となる主体',
                },
                iss: {
                  type: 'string',
                  description: 'JWTの発行者の識別子',
                },
                sub: {
                  type: 'string',
                  description: 'ユーザの一意識別子',
                },
                jti: {
                  type: 'string',
                  description: 'JWTの一意識別子',
                },
              },
            },
          },
        },
        user: {
          type: 'object',
          description: 'ユーザ情報',
        },
      },
    },
    authentication: {
      oneOf: [
        {
          type: 'object',
          description: 'ローカルユーザ認証',
          required: ['name', 'password', 'strategy'],
          properties: {
            name: {
              type: 'string',
              description: 'ユーザ名',
            },
            password: {
              type: 'string',
              description: 'パスワード',
            },
            strategy: {
              type: 'string',
              enum: ['local'],
            },
          },
        },
        {
          type: 'object',
          description: 'Shibboleth認証連携',
          required: ['token', 'strategy'],
          properties: {
            token: {
              type: 'string',
              description: 'Shibboleth認証連携トークン',
            },
            strategy: {
              type: 'string',
              enum: ['shibboleth'],
            },
          },
        },
        {
          type: 'object',
          description: 'APIアクセスキー認証',
          required: ['user', 'secret-key', 'strategy'],
          properties: {
            user: {
              type: 'string',
              description: 'ユーザ名',
            },
            'secret-key': {
              type: 'string',
              description: 'APIアクセスキー',
            },
            strategy: {
              type: 'string',
              enum: ['api-access'],
            },
          },
        },
      ],
    },
  },
};

class SscfgAuthenticationService extends AuthenticationService {
  docs: ServiceSwaggerOptions = docs;

  expire: number = ms('1d') / 1000;

  async getPayload(authResult: AuthenticationResult, params: Params): Promise<any> {
    const payload = await super.getPayload(authResult, params);
    const { strategy, accessKeyId } = authResult.authentication;
    const ret = { ...payload, strategy };
    if (accessKeyId != null) {
      Object.assign(ret, { akeyId: accessKeyId });
    }
    return ret;
  }

  get redis() {
    return this.app.get('redis');
  }

  setup() {
    super.setup();
    const { jwtOptions } = this.configuration;
    if (jwtOptions?.expiresIn != null) {
      const { expiresIn: ex } = jwtOptions;
      if (typeof ex === 'string') {
        this.expire = ms(ex) / 1000;
      } else if (typeof ex === 'number') {
        this.expire = ex;
      } else {
        throw new Error('The type of \'expiresIn\' must be string or number.');
      }
    }
  }

  async create(data: AuthenticationRequest, params: Params) {
    const authStrategies = params.authStrategies || this.configuration.authStrategies;

    if (!authStrategies.length) {
      throw new NotAuthenticated('No authentication strategies allowed for creating a JWT (`authStrategies`)');
    }

    const { authentication, ...authResult0 } = await this.authenticate(
      data, params, ...authStrategies,
    );
    const { vaultToken, ...authenticationOther } = authentication;
    const authResult: Record<string, any> = { ...authResult0, authentication: authenticationOther };

    if (authResult.accessToken) {
      return authResult;
    }

    const [payload, jwtOptions] = await Promise.all([
      this.getPayload(authResult, params),
      this.getTokenOptions(authResult, params),
    ]);

    const accessToken = await this.createAccessToken(payload, jwtOptions, params.secret);
    if (vaultToken != null) {
      await this.redis.set(accessToken, vaultToken, 'EX', this.expire);
    }

    return merge({ accessToken }, authResult, {
      authentication: {
        accessToken,
        payload: jsonwebtoken.decode(accessToken),
      },
    });
  }
}

export default function (app: Application): void {
  const authentication = new SscfgAuthenticationService(app);
  authentication.register('jwt', new JWTStrategy());
  authentication.register('local', new SscfgLocalStrategy());
  authentication.register('api-access', new ApiKeyStrategy());
  authentication.register('shibboleth', new ShibbolethStrategy());
  app.use('/authentication', authentication);
  app.use('/api/v1/authentication', authentication);
}
