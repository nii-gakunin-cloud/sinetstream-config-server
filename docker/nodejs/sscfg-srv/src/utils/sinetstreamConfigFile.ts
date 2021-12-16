/* eslint-disable max-classes-per-file */
import { KeyObject } from 'crypto';
import YAML, {
  Document, Scalar, ScalarTag, YAMLMap,
} from 'yaml';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { stringifyString } from 'yaml/util';
import { decrypt, encrypt } from './crypto';

class SinetstreamConfigfileError extends Error {}

class BadFileFormat extends SinetstreamConfigfileError {}

class IllegalArgument extends SinetstreamConfigfileError {}

interface PublicKey {
  publicKey: KeyObject;
  fingerprint: string;
}

const KEY_HEADER = 'header';
const KEY_VERSION = 'version';
const KEY_FINGERPRINT = 'fingerprint';
const KEY_CONFIG = 'config';
const KEY_TOPIC = 'topic';
const FORMAT_VERSION = 2;
const TAG_SINETSTREAM_ENCRYPTED = '!sinetstream/encrypted';

class SecretData {
  constructor(
    private data?: Buffer,
    private publicKey?: KeyObject,
    private encryptedData?: Buffer,
  ) {
    if ((data == null || publicKey == null) && encryptedData == null) {
      throw new IllegalArgument();
    }
  }

  get buffer(): Buffer {
    if (this.encryptedData != null) {
      return this.encryptedData;
    }
    if (this.data != null && this.publicKey != null) {
      return encrypt(this.data, this.publicKey);
    }
    throw new SinetstreamConfigfileError();
  }

  decrypt(privateKey: KeyObject): Buffer {
    if (this.encryptedData != null) {
      return decrypt(this.encryptedData, privateKey);
    }
    if (this.data != null && this.publicKey != null) {
      const encryptedData = encrypt(this.data, this.publicKey);
      return decrypt(encryptedData, privateKey);
    }
    throw new SinetstreamConfigfileError();
  }
}

function bufferToYamlScalar(buf: Buffer, lineWidth: number, type?: Scalar.Type): Scalar {
  const txt = buf.toString('base64');
  if (txt.length <= lineWidth && type == null) {
    const item = new Scalar(txt);
    item.type = Scalar.PLAIN;
    return item;
  }
  if (type != null && type !== Scalar.QUOTE_DOUBLE) {
    const item = new Scalar(txt);
    item.type = type;
    return item;
  }
  const lines = Array.from(
    { length: Math.ceil(txt.length / lineWidth) },
    (v, x) => txt.substring(x * lineWidth, (x + 1) * lineWidth),
  );
  const stype = type != null ? type : Scalar.BLOCK_LITERAL;
  const c = stype === Scalar.BLOCK_LITERAL ? '\n' : ' ';
  const item = new Scalar(lines.join(c));
  item.type = stype;
  return item;
}

const sinetstreamEncrypt: ScalarTag = {
  identify: (v: any): boolean => v instanceof SecretData,
  tag: TAG_SINETSTREAM_ENCRYPTED,
  default: false,
  resolve(value: string, onError: (message: string) => void): any {
    try {
      return new SecretData(
        undefined,
        undefined,
        Buffer.from(value, 'base64'),
      );
    } catch (e) {
      onError('');
      return value;
    }
  },
  stringify({ comment, type, value }, ctx, onComment, onChompKeep): string {
    if (!(value instanceof SecretData)) {
      throw new SinetstreamConfigfileError();
    }
    const lineWidth = Math.max(
      ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth,
    );
    const item = bufferToYamlScalar(value.buffer, lineWidth, type);
    if (comment != null) { item.comment = comment; }
    return stringifyString(item, ctx, onComment, onChompKeep);
  },
};

const binaryTag: ScalarTag = {
  identify: (value: any) => value instanceof Buffer && value.length > 0,
  default: false,
  tag: 'tag:yaml.org,2002:binary',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resolve: (src, _) => Buffer.from(src, 'base64'),
  stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
    const lineWidth = Math.max(
      ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth,
    );
    const item = bufferToYamlScalar(value as Buffer, lineWidth, type);
    if (comment != null) { item.comment = comment; }
    return stringifyString(item, ctx, onComment, onChompKeep);
  },
};

function getContents(yaml: string | Document.Parsed): YAMLMap {
  const doc: Document.Parsed = typeof yaml === 'string' ? YAML.parseDocument(yaml) : yaml;
  if (!(doc.contents instanceof YAMLMap)) {
    throw new BadFileFormat();
  }
  return doc.contents;
}

function getFormatVersion(yaml: string | Document.Parsed): number {
  const contents = getContents(yaml);
  const ver = contents.getIn([KEY_HEADER, KEY_VERSION]);
  if (ver == null) {
    return 1;
  }
  return Number(ver);
}

function isV2Format(yaml: string | Document.Parsed): boolean {
  return getFormatVersion(yaml) >= 2;
}

function convertV2Format(doc: Document.Parsed): Document.Parsed {
  if (isV2Format(doc)) {
    return doc;
  }
  const contents = getContents(doc);
  const cfg = new YAMLMap();
  const keys = contents.items.map((x) => x.key);
  contents.items.forEach((it) => {
    cfg.add(it);
  });
  keys.forEach((x) => {
    contents.delete(x);
  });
  contents.add(doc.createPair(KEY_HEADER, doc.createNode({ version: FORMAT_VERSION })));
  contents.add(doc.createPair(KEY_CONFIG, cfg));
  return doc;
}

function getServices(doc: Document.Parsed): YAMLMap {
  if (!isV2Format(doc)) {
    return getContents(doc);
  }
  const contents = getContents(doc);
  const services = contents.getIn([KEY_CONFIG]);
  if (!(services instanceof YAMLMap)) {
    return new YAMLMap();
  }
  return services;
}

function getTopics(doc: Document.Parsed): string[] {
  const services = getServices(doc);
  return services.items
    .map((x) => x.value)
    .filter((x): x is YAMLMap => x instanceof YAMLMap)
    .map((x) => x.getIn([KEY_TOPIC]))
    .filter((x): x is string => typeof x === 'string');
}

function addValue(node: YAMLMap, paths: string[], value: any, comment?: string): void {
  const [top, ...rest] = paths;
  if (top.trim().length === 0) {
    throw new IllegalArgument();
  }
  if (rest.length === 0) {
    if (node.has(top)) {
      node.delete(top);
    }
    const sKey = new Scalar(top);
    node.set(sKey, new Scalar(value));
    if (comment != null) {
      sKey.commentBefore = ` embed: ${comment}`;
    }
    return;
  }
  const child = node.get(top);
  if (child != null) {
    if (child instanceof YAMLMap) {
      addValue(child, rest, value, comment);
      return;
    }
    throw new BadFileFormat();
  }
  const newChild = new YAMLMap();
  node.set(top, newChild);
  addValue(newChild, rest, value, comment);
}

function embedValue(doc: Document.Parsed, path: string, value: string | Buffer | SecretData): void {
  const paths = path.split('.');
  if (paths.length <= 1) {
    throw new IllegalArgument(`The target is not correct.: ${path}`);
  }
  const [top, ...rest] = paths;
  const services = getServices(doc);
  try {
    if (top !== '*') {
      if (top.includes('*')) {
        throw new IllegalArgument(`The target is not correct.: ${path}`);
      }
      addValue(services, paths, value, path);
    } else if (rest.length > 0) {
      services.items.forEach((it) => {
        if (it.value instanceof YAMLMap) {
          addValue(it.value, rest, value, path);
        }
      });
    }
  } catch (e) {
    if (e instanceof BadFileFormat) {
      throw new BadFileFormat(
        `The type of the node in the middle of the embedding destination is not Map.: ${path}`,
      );
    }
    throw e;
  }
}

function embedFingerprint(doc: Document.Parsed, publicKey: PublicKey): void {
  if (!isV2Format(doc)) {
    throw new IllegalArgument();
  }
  doc.setIn([KEY_HEADER, KEY_FINGERPRINT], publicKey.fingerprint);
}

function embedWarning(doc: Document.Parsed, message: string): void {
  const root = doc.getIn([]);
  if (root instanceof YAMLMap) {
    const msg = message.toUpperCase().startsWith('WARNING')
      ? ` ${message}`
      : ` 警告: ${message}`;
    root.commentBefore = root.commentBefore != null
      ? [msg, root.commentBefore].join('\n')
      : msg;
  }
}

function embedError(doc: Document.Parsed, message: string): void {
  const root = doc.getIn([]);
  if (root instanceof YAMLMap) {
    const msg = message.toUpperCase().startsWith('ERROR')
      ? ` ${message}`
      : ` エラー: ${message}`;
    root.commentBefore = root.commentBefore != null
      ? [msg, root.commentBefore].join('\n')
      : msg;
  }
}

function embedSecret(
  doc: Document.Parsed, path: string, value: Buffer, publicKey?: PublicKey,
): void {
  if (publicKey != null) {
    embedValue(doc, path, new SecretData(value, publicKey.publicKey));
    embedFingerprint(doc, publicKey);
  } else {
    embedWarning(doc, 'ユーザ公開鍵が登録されていません。');
  }
}

export {
  SinetstreamConfigfileError,
  BadFileFormat,
  IllegalArgument,
  getFormatVersion,
  isV2Format,
  convertV2Format,
  getTopics,
  SecretData,
  embedValue,
  embedSecret,
  embedWarning,
  embedError,
  sinetstreamEncrypt,
  binaryTag,
  PublicKey,
};
