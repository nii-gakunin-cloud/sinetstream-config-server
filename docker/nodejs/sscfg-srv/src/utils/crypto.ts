import { GeneralError } from '@feathersjs/errors';
import {
  constants, createCipheriv, createDecipheriv, KeyObject, privateDecrypt, publicEncrypt,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SIZE_HEADER = 4;
const SIZE_IV = 12;
const SIZE_TAG = 16;

const HEADER = Buffer.from([0x00, 0x01, 0x01, 0x01]);

function encrypt(data: Buffer, publicKey: KeyObject): Buffer {
  const key = randomBytes(32);
  const encryptedKey = publicEncrypt({
    key: publicKey,
    padding: constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  }, key);

  const iv = randomBytes(SIZE_IV);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.concat([HEADER, encryptedKey, iv]));

  return Buffer.concat([
    HEADER,
    encryptedKey,
    iv,
    cipher.update(data),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
}

function decrypt(data: Buffer, privateKey: KeyObject): Buffer {
  // const header = data.subarray(POS_HEADER, SIZE_HEADER);
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
    oaepHash: 'sha256',
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
  HEADER,
  encrypt,
  decrypt,
};
