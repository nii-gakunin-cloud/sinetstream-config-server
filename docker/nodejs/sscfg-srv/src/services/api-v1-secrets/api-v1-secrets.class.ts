/* eslint-disable no-underscore-dangle */
/* eslint max-classes-per-file: ["error", 2] */
import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import {
  BadRequest, MethodNotAllowed, NotAuthenticated, NotFound,
} from '@feathersjs/errors';
import {
  Id, Params, Query, ServiceAddons, ServiceMethods,
} from '@feathersjs/feathers';
import { createPublicKey } from 'crypto';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import { Application } from '../../declarations';
import { toVid as toAttachFileVid } from '../../hooks/process-attach-files';
import { toVid as toEncryptKeyVid } from '../../hooks/process-encrypt-keys';
import { toVid as toPublicKeyVid } from '../../hooks/process-public-key';
import { toVid as toUserParameterVid } from '../../hooks/process-user-parameters';
import { encrypt, KeyEncapsulateMechanism, RsaOaep } from '../../utils/crypto';
import { PublicKey } from '../../utils/sinetstreamConfigFile';
import { Streams } from '../streams/streams.class';
import { Vault } from '../vault/vault.class';

interface Data {
  id: Id;
  fingerprint: string;
  target: string;
  value: string;
}

const SecretServices = ['encrypt-keys', 'attach-files', 'user-parameters'] as const;
type SecretServiceType = typeof SecretServices[number];

export const RsaOaepSha256 = '0x1' as const;
export const RsaOaepSha1 = '0x2' as const;

function isSecretServiceType(arg: string): arg is SecretServiceType {
  return ['encrypt-keys', 'attach-files', 'user-parameters'].includes(arg);
}

interface ServiceId {
  name: SecretServiceType;
  id: number;
}

const HTTP_HEADER_FINGERPRINT = 'sinetstream-config-publickey';

class InnerApiV1Secrets extends AdapterService<Data> implements ServiceMethods<Data> {
  app: Application;

  vaultService: Vault & ServiceAddons<any>;

  streamService: Streams & ServiceAddons<any>;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    super(options);
    this.app = app;
    this.vaultService = app.service('vault');
    this.streamService = app.service('streams');
  }

  async getPublicKey(params?: Params): Promise<PublicKey> {
    const { user, headers, authentication } = params ?? {};
    if (user == null) {
      throw new NotAuthenticated();
    }
    const service = this.app.service('public-keys');
    let vid: string;
    if (headers != null && HTTP_HEADER_FINGERPRINT in headers) {
      const fparams = headers[HTTP_HEADER_FINGERPRINT].split(':');
      if (fparams.length === 2 && fparams[0] !== 'SHA256') {
        throw new BadRequest('The public key corresponding to the fingerprint has not been registered.');
      }
      const requestFingerprint = fparams[fparams.length - 1];
      const ret = await service.find({
        user,
        query: {
          user_id: user.id,
          fingerprint: { $like: `SHA256:${requestFingerprint}%` },
        },
        paginate: false,
      }) as any[];
      if (ret.length === 0) {
        throw new BadRequest('The public key corresponding to the fingerprint has not been registered.');
      }
      vid = toPublicKeyVid(ret[0]);
    } else {
      const ret = await service.find({
        user,
        query: {
          user_id: user.id,
          defaultKey: true,
        },
        paginate: false,
      }) as any[];
      if (ret.length === 0) {
        throw new BadRequest('The default public key has not been registered.');
      }
      vid = toPublicKeyVid(ret[0]);
    }
    const { publicKey, fingerprint } = await this.vaultService.get(vid, { authentication });
    return { publicKey: createPublicKey(publicKey), fingerprint };
  }

  static parseId(id: Id): ServiceId {
    if (typeof id !== 'string') {
      throw new BadRequest();
    }
    const params = id.split('-');
    const sid = Number(params[params.length - 1]);
    const name = params.slice(0, 2).join('-');
    if (!isSecretServiceType(name)) {
      throw new NotFound();
    }
    return { name, id: sid };
  }

  static getKem(query: Query | undefined): KeyEncapsulateMechanism {
    const { kem } = query || {};
    if (kem == null) {
      return RsaOaep.Sha256;
    }
    switch (kem) {
      case RsaOaepSha256:
        return RsaOaep.Sha256;
      case RsaOaepSha1:
        return RsaOaep.Sha1;
      default:
        throw new BadRequest();
    }
  }

  async _get(id: Id, params?: Params): Promise<Data> {
    const serviceId = InnerApiV1Secrets.parseId(id);
    const { user, authentication, query } = params ?? {};
    if (user == null) {
      throw new NotAuthenticated();
    }
    const publicKey = await this.getPublicKey({ ...params });
    const service = this.app.service(serviceId.name);
    const item = await service.get(serviceId.id, { user, authentication });
    const { stream_id: sid } = item;
    await this.streamService.get(sid, { user, authentication });

    let vid: string;
    if (serviceId.name === 'encrypt-keys') {
      vid = toEncryptKeyVid(item);
    } else if (serviceId.name === 'attach-files') {
      vid = toAttachFileVid(item);
    } else if (serviceId.name === 'user-parameters') {
      vid = toUserParameterVid(item);
    } else {
      throw new BadRequest();
    }
    const kem = InnerApiV1Secrets.getKem(query);
    const { value } = await this.vaultService.get(vid, { authentication });
    const encryptedString = encrypt(Buffer.from(value, 'base64'), publicKey.publicKey, kem).toString('base64');

    return {
      id,
      fingerprint: publicKey.fingerprint,
      target: item.target,
      value: encryptedString,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _find(params?: Params): Promise<Data[]> {
    throw new MethodNotAllowed();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _create(data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _update(id: Id, data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _patch(id: Id, data: Data, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _remove(id: Id, params?: Params): Promise<Data> {
    throw new MethodNotAllowed();
  }
}

const docs: ServiceSwaggerOptions = {
  idType: 'string',
  securities: ['all'],
  operations: {
    get: {
      description: '指定された id のコンフィグ情報を取得する',
      parameters: [
        {
          name: 'kem',
          in: 'query',
          type: 'string',
          enum: ['0x1', '0x2'],
          default: '0x1',
          description: '秘匿情報の暗号化方式の指定(0x1: OAEP-RSA sha256, 0x2: OAEP-RSA sha1)。',
        },
        {
          name: 'SINETStream-config-publickey',
          in: 'header',
          schema: { type: 'string' },
          required: false,
          description: '秘匿情報の暗号化に用いる公開鍵のフィンガープリント',
        },
      ],
    },
  },
  definitions: {
    secrets_v1: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'id',
        },
        fingerprint: {
          type: 'string',
          description: '秘匿情報の暗号化に用いた公開鍵のフィンガープリント',
        },
        target: {
          type: 'string',
          description: '設定ファイルへの埋め込み位置',
        },
        value: {
          type: 'string',
          description: '暗号化した秘匿情報',
        },
      },
    },
  },
};

export class ApiV1Secrets {
  adapter: InnerApiV1Secrets;

  docs: ServiceSwaggerOptions = docs;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    this.adapter = new InnerApiV1Secrets(options, app);
  }

  async get(id: Id, params?: Params): Promise<Data> {
    return this.adapter.get(id, params);
  }

  get id(): string {
    return this.adapter.id;
  }

  get events(): string[] {
    return this.adapter.events;
  }
}
