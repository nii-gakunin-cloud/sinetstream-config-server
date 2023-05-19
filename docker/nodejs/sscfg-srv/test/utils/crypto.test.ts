import {
  constants, createDecipheriv, generateKeyPairSync, privateDecrypt,
} from 'crypto';
import {
  ALGORITHM, decrypt, encrypt, hash, IllegalMessage, RsaOaep, SIZE_HEADER, SIZE_IV, SIZE_TAG,
} from '../../src/utils/crypto';

describe('crypto utils', () => {
  it.each([[RsaOaep.Sha256, 1], [RsaOaep.Sha1, 2]])('encrypt %s', (kem, hdr2) => {
    const { publicKey: pubKey, privateKey: privKey } = generateKeyPairSync('rsa', {
      modulusLength: 3072,
    });

    expect.assertions(4);
    const data = 'abc';

    const res = encrypt(Buffer.from(data), pubKey, kem);
    const { modulusLength } = pubKey.asymmetricKeyDetails || {};
    if (modulusLength == null) {
      return;
    }
    const sizeEncryptedKey = modulusLength / 8;
    const posKey = SIZE_HEADER;
    const posIv = posKey + sizeEncryptedKey;
    const posData = posIv + SIZE_IV;
    const posTag = res.length - SIZE_TAG;

    const header = res.subarray(0, SIZE_HEADER);
    const encryptedKey = res.subarray(posKey, posIv);
    const iv = res.subarray(posIv, posData);
    const encryptedData = res.subarray(posData, posTag);
    const tag = res.subarray(posTag, res.length);

    const key = privateDecrypt({
      key: privKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: hash(kem),
    }, encryptedKey);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(res.subarray(0, posData));
    decipher.setAuthTag(tag);

    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    expect(header.readUint16BE()).toBe(1);
    expect(header.readUint8(2)).toBe(hdr2);
    expect(header.readUint8(3)).toBe(1);
    expect(decryptedData.toString()).toBe(data);
  });

  it.each([RsaOaep.Sha256, RsaOaep.Sha1])('decrypt %s', (kem) => {
    const { publicKey: pubKey, privateKey: privKey } = generateKeyPairSync('rsa', {
      modulusLength: 3072,
    });
    expect.assertions(1);
    const data = 'abc';
    const encryptedData = encrypt(Buffer.from(data), pubKey, kem);
    const res = decrypt(encryptedData, privKey);
    expect(res.toString()).toBe(data);
  });

  it('illegal message', () => {
    const { publicKey: pubKey, privateKey: privKey } = generateKeyPairSync('rsa', {
      modulusLength: 3072,
    });
    expect.assertions(1);
    const data = 'abc';
    const encryptedData = encrypt(Buffer.from(data), pubKey);
    encryptedData.writeUInt8(0, 2);
    expect(() => {
      decrypt(encryptedData, privKey);
    }).toThrow(IllegalMessage);
  });
});
