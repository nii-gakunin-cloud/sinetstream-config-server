/* eslint-disable no-underscore-dangle */
/* eslint max-classes-per-file: ["error", 2] */
import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { AuthenticationRequest } from '@feathersjs/authentication/lib';
import {
  BadRequest, GeneralError, MethodNotAllowed, NotAuthenticated, NotFound,
} from '@feathersjs/errors';
import {
  Id, Paginated, Params, Query, ServiceAddons, ServiceMethods,
} from '@feathersjs/feathers';
import { createPublicKey } from 'crypto';
import { ServiceSwaggerOptions } from 'feathers-swagger/types';
import YAML, { Document } from 'yaml';
import { Application } from '../../declarations';
import { toVid as toAttachFileVid } from '../../hooks/process-attach-files';
import { toVid as toEncryptKeyVid } from '../../hooks/process-encrypt-keys';
import { toVid as toPublicKeyVid } from '../../hooks/process-public-key';
import { toVid as toUserParameterVid } from '../../hooks/process-user-parameters';
import {
  binaryTag, convertV2Format, embedError, embedSecret, embedValue, PublicKey, sinetstreamEncrypt,
} from '../../utils/sinetstreamConfigFile';
import { Streams } from '../streams/streams.class';
import { Vault } from '../vault/vault.class';

interface Attachment {
  value: string;
  target: string;
}

type SecretId = string;
interface EncryptKeyFlags {
  enabled: boolean;
  latest: boolean;
}

interface EncryptKeyId {
  id: SecretId;
  version: number;
}

type SecretIds = EncryptKeyId[];
interface EncryptKeySecret {
  ids: SecretIds;
  target: string;
}

interface GeneralSecret {
  id: SecretId;
  target: string;
}

type Secret = GeneralSecret | EncryptKeySecret;
interface Data {
  id: number;
  name: string;
  yaml?: string;
  config?: Record<string, any>;
  attachments?: Attachment[];
  secrets?: Secret[];
}

interface ProcessData {
  id: number;
  doc: Document.Parsed;
  publicKey?: PublicKey;
  user?: Record<string, any>;
  query?: Query;
  config?: Record<string, any>;
  attachments?: Attachment[];
  secrets?: Secret[];
}

type SelectType = 'yaml' | 'object' | 'attachments' | 'secrets';
type EmbedType = 'attachment' | 'secret' | 'text';
function isSelectType(arg: string): arg is SelectType {
  return ['yaml', 'object', 'attachments', 'secrets'].includes(arg);
}
function isEmbedType(arg: string): arg is EmbedType {
  return ['attachment', 'secret', 'text'].includes(arg);
}

class InnerConfigFiles extends AdapterService<Data> implements ServiceMethods<Data> {
  app: Application;

  service: Streams & ServiceAddons<any>;

  vault: Vault & ServiceAddons<any>;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    super(options);
    this.app = app;
    this.service = app.service('streams');
    this.vault = app.service('vault');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async _find(params?: Params): Promise<Data[] | Paginated<Data>> {
    throw new MethodNotAllowed();
  }

  async getPublicKey(params?: Params): Promise<PublicKey | null> {
    const { user, authentication } = params ?? {};
    if (user == null) {
      throw new NotAuthenticated();
    }
    const service = this.app.service('public-keys');
    const items = await service.find({
      user,
      authentication,
      query: {
        user_id: user.id,
        defaultKey: true,
      },
      paginate: false,
    }) as any[];
    if (items.length === 0) {
      return null;
    }
    const vid = toPublicKeyVid(items[0]);
    const { publicKey, fingerprint } = await this.vault.get(vid, { authentication });
    return { publicKey: createPublicKey(publicKey), fingerprint };
  }

  async applyEncryptKeys(
    data: ProcessData, authentication: AuthenticationRequest,
  ): Promise<ProcessData> {
    const service = this.app.service('encrypt-keys');
    const { user, query } = data;
    const items = await service.find({
      user,
      query: {
        stream_id: data.id,
        $joinEager: 'latestVersion',
        $sort: { target: 1, version: -1 },
      },
      paginate: false,
    }) as any[];
    if (items.length === 0) {
      return data;
    }
    const v2doc = convertV2Format(data.doc);

    const secrets: Secret[] = data.secrets ?? [];
    const doEmbedding = InnerConfigFiles.getEmbedTarget(query).includes('secret');

    const idsMap = items.map((it) => {
      const vid = toEncryptKeyVid(it);
      return {
        id: vid.split('.').slice(-2).join('-'),
        version: it.version,
        target: it.target,
        enabled: it.enabled,
        latest: it.latestVersion.ver === it.version,
      };
    }).reduce((acc: Record<string, (EncryptKeyId & EncryptKeyFlags)[]>, it) => {
      const {
        target, id, version, enabled, latest,
      } = it;
      const eid: EncryptKeyId & EncryptKeyFlags = {
        id, version, enabled, latest,
      };
      if (target in acc) {
        acc[target].push(eid);
      } else {
        acc[target] = [eid];
      }
      return acc;
    }, {});
    Object.keys(idsMap).forEach((target) => {
      if (idsMap[target].some((x) => x.enabled && x.latest)) {
        const ids: EncryptKeyId[] = idsMap[target].map(
          (it) => ({ id: it.id, version: it.version }),
        );
        secrets.push({ target, ids });
      }
    });

    if (doEmbedding) {
      await Promise.all(items
        .filter((it) => it.latestVersion.ver === it.version && it.enabled)
        .map(async (it: any) => {
          const vid = toEncryptKeyVid(it);
          const { value: encryptKey } = await this.vault.get(vid, { authentication });
          embedSecret(v2doc, it.target, Buffer.from(encryptKey, 'base64'), data.publicKey);
        }));
    }
    let ret: ProcessData = { ...data, doc: v2doc };

    if (InnerConfigFiles.getSelectTarget(query).includes('secrets')) {
      ret = { ...ret, secrets };
    }
    return ret;
  }

  async applyAttachFiles(
    data: ProcessData, authentication: AuthenticationRequest,
  ): Promise<ProcessData> {
    const service = this.app.service('attach-files');
    const { user, query } = data;
    const items = await service.find({
      user,
      query: {
        stream_id: data.id,
        enabled: true,
        $sort: { target: 1, updatedAt: 1 },
      },
      paginate: false,
    }) as any[];
    if (items.length === 0) {
      return data;
    }
    const v2doc = convertV2Format(data.doc);

    const attachments: Attachment[] = data.attachments ?? [];
    const secrets: Secret[] = data.secrets ?? [];
    const embedTargets = InnerConfigFiles.getEmbedTarget(query);
    const doAttachmentEmbedding = embedTargets.includes('attachment');
    const doSecretEmbedding = embedTargets.includes('secret');
    await Promise.all(items.map(async (it: any) => {
      const { target, content, secret } = it;
      if (secret) {
        const vid = toAttachFileVid(it);
        const { value: encryptedData } = await this.vault.get(vid, { authentication });
        secrets.push({ id: vid.split('.').slice(-2).join('-'), target: it.target });
        if (doSecretEmbedding) {
          embedSecret(v2doc, target, Buffer.from(encryptedData, 'base64'), data.publicKey);
        }
      } else {
        attachments.push({ value: it.content.toString('base64'), target: it.target });
        if (doAttachmentEmbedding) {
          embedValue(v2doc, target, content);
        }
      }
    }));
    let ret: ProcessData = { ...data, doc: v2doc };

    const selectTargets = InnerConfigFiles.getSelectTarget(query);
    if (selectTargets.includes('attachments')) {
      ret = { ...ret, attachments };
    }
    if (selectTargets.includes('secrets')) {
      ret = { ...ret, secrets };
    }
    return ret;
  }

  async applyUserParameters(
    data: ProcessData, authentication: AuthenticationRequest,
  ): Promise<ProcessData> {
    const service = this.app.service('user-parameters');
    const { user, query } = data;
    const items = await service.find({
      user,
      query: {
        stream_id: data.id,
        user_id: user?.id,
        enabled: true,
        $sort: { target: 1, updatedAt: 1 },
      },
      paginate: false,
    }) as any[];
    if (items.length === 0) {
      return data;
    }
    const v2doc = convertV2Format(data.doc);

    const attachments: Attachment[] = data.attachments ?? [];
    const secrets: Secret[] = data.secrets ?? [];
    const embedTargets = InnerConfigFiles.getEmbedTarget(query);
    const doAttachmentEmbedding = embedTargets.includes('attachment');
    const doSecretEmbedding = embedTargets.includes('secret');
    const doTextEmbedding = embedTargets.includes('text');
    await Promise.all(items.map(async (it: any) => {
      const {
        target, content, isBinary, secret,
      } = it;
      if (secret) {
        const vid = toUserParameterVid(it);
        const { value: encryptedData } = await this.vault.get(vid, { authentication });
        const vidParams = vid.split('.').slice(-3);
        secrets.push({
          id: `${vidParams[0]}-${vidParams[2]}`,
          target: it.target,
        });
        if (doSecretEmbedding) {
          embedSecret(v2doc, target, Buffer.from(encryptedData, 'base64'), data.publicKey);
        }
      } else if (isBinary) {
        attachments.push({ value: it.content.toString('base64'), target: it.target });
        if (doAttachmentEmbedding) {
          embedValue(v2doc, target, content);
        }
      } else if (doTextEmbedding) {
        embedValue(v2doc, target, content.toString());
      }
    }));
    let ret: ProcessData = { ...data, doc: v2doc };

    const selectTargets = InnerConfigFiles.getSelectTarget(query);
    if (selectTargets.includes('attachments')) {
      ret = { ...ret, attachments };
    }
    if (selectTargets.includes('secrets')) {
      ret = { ...ret, secrets };
    }
    return ret;
  }

  static getSelectTarget(query?: Query): SelectType[] {
    if (query == null || query.$select == null) {
      return ['yaml'];
    }
    const { $select: select } = query;
    if (select instanceof Array) {
      if (select.every(isSelectType)) {
        return Array.from(select);
      }
    } if (typeof select === 'string') {
      if (isSelectType(select)) {
        return Array.of(select);
      }
      const sparams = select.split(',').map((x) => x.trim());
      if (sparams.every(isSelectType)) {
        return Array.from(sparams);
      }
    }
    throw new BadRequest();
  }

  static getEmbedTarget(query?: Query): EmbedType[] {
    if (query == null || query.$embed == null) {
      return ['attachment', 'secret', 'text'];
    }
    const { $embed: embedParams } = query;
    let params: string[];
    if (embedParams instanceof Array) {
      params = embedParams.map((x) => x.trim());
    } else if (typeof embedParams === 'string') {
      params = embedParams.split(',').map((x) => x.trim());
    } else {
      throw new BadRequest();
    }
    if (params.includes('all')) {
      if (!params.includes('none')) {
        return ['attachment', 'secret', 'text'];
      }
    } else if (params.includes('none')) {
      return [];
    } else if (params.every(isEmbedType)) {
      return Array.from(params);
    }
    throw new BadRequest();
  }

  async _get(id: Id, params?: Params): Promise<Data> {
    const {
      user, query, authentication, ...other
    } = params ?? {};
    if (authentication == null) {
      throw new NotAuthenticated();
    }

    const stream = await this.service.get(id, { user, authentication, ...other });
    const { configFile } = stream;
    const selectTarget = InnerConfigFiles.getSelectTarget(query);
    if (configFile == null || configFile.trim().length === 0) {
      // throw new NotFound('The configuration file has not been registered.');
      let ret: Data = { id: Number(id), name: stream.name };
      if (selectTarget.includes('yaml')) {
        ret = { ...ret, yaml: '' };
      }
      if (selectTarget.includes('object')) {
        ret = { ...ret, config: {} };
      }
      if (selectTarget.includes('attachments')) {
        ret = { ...ret, attachments: [] };
      }
      if (selectTarget.includes('secrets')) {
        ret = { ...ret, secrets: [] };
      }
      return ret;
    }
    let data: ProcessData = {
      id: stream.id,
      doc: YAML.parseDocument(
        configFile || '',
        { customTags: [binaryTag, sinetstreamEncrypt] },
      ),
      user,
      query,
    };
    if (data.doc.errors == null || data.doc.errors.length === 0) {
      try {
        const publicKey = await this.getPublicKey({ user, authentication });
        if (publicKey != null) {
          data.publicKey = publicKey;
        }
      } catch (e) {
        if (!(e instanceof NotFound)) {
          throw e;
        }
      }
      try {
        data = await this.applyEncryptKeys(data, authentication);
        data = await this.applyAttachFiles(data, authentication);
        data = await this.applyUserParameters(data, authentication);
      } catch (e: any) {
        if (!selectTarget.includes('yaml')) {
          throw e;
        }
        embedError(data.doc, e.toString());
      }
    } else {
      const [err] = data.doc.errors;
      if (err?.message == null) {
        throw new GeneralError();
      }
      const msg = err?.message.split('\n')[0];
      if (!selectTarget.includes('yaml')) {
        throw new BadRequest(msg);
      }
      embedError(data.doc, `ERROR: ${msg}`);
    }

    let ret: Data = {
      id: Number(id),
      name: stream.name,
    };
    if (selectTarget.includes('yaml')) {
      ret = {
        ...ret,
        yaml: YAML.stringify(data.doc, { customTags: [binaryTag, sinetstreamEncrypt] }),
      };
    }
    if (selectTarget.includes('object')) {
      ret = {
        ...ret,
        config: data.doc.toJSON(),
      };
    }
    if (selectTarget.includes('attachments')) {
      ret = {
        ...ret,
        attachments: data.attachments != null ? data.attachments : [],
      };
    }
    if (selectTarget.includes('secrets')) {
      ret = {
        ...ret,
        secrets: data.secrets != null ? data.secrets : [],
      };
    }
    return ret;
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
  description: '設定ファイルのサービス',
  securities: ['all'],
  definitions: {
    'config-files': {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: {
          type: 'string',
          description: 'コンフィグ情報名',
        },
        yaml: {
          type: 'string',
          description: '設定ファイル',
        },
        config: {
          type: 'object',
          description: '設定ファイル（json）',
        },
        secrets: {
          type: 'array',
          description: '秘匿情報',
        },
        attachments: {
          type: 'array',
          description: '添付ファイル',
        },
      },
    },
  },
};

export class ConfigFiles {
  adapter: InnerConfigFiles;

  docs: ServiceSwaggerOptions = docs;

  constructor(options: Partial<ServiceOptions>, app: Application) {
    this.adapter = new InnerConfigFiles(options, app);
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
