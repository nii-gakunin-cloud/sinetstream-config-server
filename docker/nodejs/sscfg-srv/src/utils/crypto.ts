import { GeneralError } from '@feathersjs/errors';
import {
  constants, createCipheriv, createDecipheriv, KeyObject, privateDecrypt, publicEncrypt,
  randomBytes,
} from 'crypto';

class IllegalMessage extends Error { }

const ALGORITHM = 'aes-256-gcm';
const SIZE_HEADER = 4;
const SIZE_IV = 12;
const SIZE_TAG = 16;

const RsaOaep = {
  Sha256: 'sha256',
  Sha1: 'sha1',
} as const;
type KeyEncapsulateMechanism = typeof RsaOaep[keyof typeof RsaOaep];

function hash(m: KeyEncapsulateMechanism): string {
  return m;
}

function kemToHeader(m: KeyEncapsulateMechanism): number {
  switch (m) {
    case RsaOaep.Sha256:
      return 1;
    case RsaOaep.Sha1:
      return 2;
    default: {
      const exhaustiveCheck: never = m;
      return exhaustiveCheck;
    }
  }
}

function headerToKem(header: Buffer): KeyEncapsulateMechanism {
  const v = header.readUInt8(2);
  switch (v) {
    case 1:
      return RsaOaep.Sha256;
    case 2:
      return RsaOaep.Sha1;
    default:
      throw new IllegalMessage();
  }
}

function toHeader(m: KeyEncapsulateMechanism): Buffer {
  return Buffer.from([0x00, 0x01, kemToHeader(m), 0x01]);
}

function encrypt(
  data: Buffer,
  publicKey: KeyObject,
  kem: KeyEncapsulateMechanism = RsaOaep.Sha256,
): Buffer {
  const header = toHeader(kem);
  const key = randomBytes(32);
  const encryptedKey = publicEncrypt({
    key: publicKey,
    padding: constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: hash(kem),
  }, key);

  const iv = randomBytes(SIZE_IV);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.concat([header, encryptedKey, iv]));

  return Buffer.concat([
    header,
    encryptedKey,
    iv,
    cipher.update(data),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
}

function decrypt(data: Buffer, privateKey: KeyObject): Buffer {
  const header = data.subarray(0, SIZE_HEADER);
  const { modulusLength } = privateKey.asymmetricKeyDetails || {};
  if (modulusLength == null) {
    throw new GeneralError('Invalid KeyObject');
  }
  const sizeEncryptedKey = modulusLength / 8;

  let pos = SIZE_HEADER;
  const encryptedKey = data.subarray(pos, pos + sizeEncryptedKey);
  pos += sizeEncryptedKey;
  const iv = data.subarray(pos, pos + SIZE_IV);
  pos += SIZE_IV;
  const encryptedData = data.subarray(pos, data.length - SIZE_TAG);
  const tag = data.subarray(data.length - SIZE_TAG);

  const key = privateDecrypt({
    key: privateKey,
    padding: constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: hash(headerToKem(header)),
  }, encryptedKey);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(data.subarray(0, pos));
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);
}

export {
  ALGORITHM,
  SIZE_HEADER,
  SIZE_IV,
  SIZE_TAG,
  hash,
  encrypt,
  decrypt,
  KeyEncapsulateMechanism,
  RsaOaep,
  IllegalMessage,
};
