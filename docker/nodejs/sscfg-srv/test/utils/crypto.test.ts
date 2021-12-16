import {
  constants, createDecipheriv, generateKeyPairSync, privateDecrypt,
} from 'crypto';
import {
  ALGORITHM, encrypt, HEADER, SIZE_HEADER, SIZE_IV, SIZE_TAG,
} from '../../src/utils/crypto';

describe('crypto utils', () => {
  it('encrypt', () => {
    const { publicKey: pubKey, privateKey: privKey } = generateKeyPairSync('rsa', {
      modulusLength: 3072,
    });

    expect.assertions(2);
    const data = 'abc';

    const res = encrypt(Buffer.from(data), pubKey);
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
      oaepHash: 'sha256',
    }, encryptedKey);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(res.subarray(0, posData));
    decipher.setAuthTag(tag);

    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    expect(header.equals(HEADER)).toBe(true);
    expect(decryptedData.toString()).toBe(data);
  });
});
