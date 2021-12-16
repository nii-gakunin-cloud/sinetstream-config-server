/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import { generateKeyPairSync, KeyObject } from 'crypto';
import YAML from 'yaml';
import sshpk from 'sshpk';
import {
  BadFileFormat,
  binaryTag,
  convertV2Format, embedSecret, embedValue, getTopics,
  IllegalArgument, isV2Format, SecretData, sinetstreamEncrypt,
} from '../../src/utils/sinetstreamConfigFile';

describe('sinetstream config file', () => {
  const TOPICS = ['kafka-topic', 'mqtt-topic'];
  const SERVICES = ['service-kafka', 'service-mqtt'];
  const configFileV2 = (topicA = TOPICS[0], topicB = TOPICS[1], version = 2) => (`
# header comment
header:
  version: ${version}

config:
  # service-1
  ${SERVICES[0]}:
    type: kafka
    brokers:
      - kafka0:9092
      - kafka1:9092
    topic: ${topicA} # topic-1

  # service-2
  ${SERVICES[1]}:
    type: mqtt
    brokers: mqtt:1883
    topic: ${topicB} # topic-2
`.trim());
  const configFileV1 = (topicA = TOPICS[0], topicB = TOPICS[1]) => (YAML.stringify(
    YAML.parseDocument(configFileV2(topicA, topicB)).get('config'),
  ).trim());

  const textValue = 'user-001';
  const binaryValue = 'yzgRcywpgjQ/oYKw26itbb5HPJo4xResRo2f7F1xSvs=';
  const target1 = `${SERVICES[0]}.param1`;
  const target2 = '*.param2';
  const target3 = `${SERVICES[0]}.tls.param3`;
  const target4 = `${SERVICES[0]}.type`;

  const targetX1 = `${SERVICES[0]}.brokers`;
  const targetX2 = `${SERVICES[0]}.type.tls.paramX`;

  let pubKey: KeyObject;
  let privKey: KeyObject;
  let fingerprint: string;

  describe('ファイルフォーマットバージョン', () => {
    it('v1', () => {
      expect(isV2Format(configFileV1())).toBe(false);
    });

    it('v2', () => {
      expect(isV2Format(configFileV2())).toBe(true);
    });

    it('v3', () => {
      expect(isV2Format(configFileV2(TOPICS[0], TOPICS[1], 3))).toBe(true);
    });
  });

  describe('ファイルフォーマットの変換', () => {
    it('v1からv2への変換', () => {
      const doc = YAML.parseDocument(configFileV1());
      const v2 = convertV2Format(doc);
      expect(isV2Format(v2)).toBe(true);
    });

    it('v2の設定ファイルに適用しても変更されない', () => {
      const cfg = configFileV2();
      const doc = YAML.parseDocument(cfg);
      const v2 = convertV2Format(doc);
      expect(isV2Format(v2)).toBe(true);
      expect(YAML.stringify(v2).trim()).toBe(cfg);
    });
  });

  describe('トピック名の取得', () => {
    it('v2', () => {
      const doc = YAML.parseDocument(configFileV2());
      const topics = getTopics(doc);
      expect(topics).toEqual(TOPICS);
    });

    it('v1', () => {
      const doc = YAML.parseDocument(configFileV1());
      const topics = getTopics(doc);
      expect(topics).toEqual(TOPICS);
    });
  });

  describe('値の埋め込み', () => {
    describe.each([
      ['v1', configFileV1()],
      ['v2', configFileV2()],
    ])('ファイルフォーマット: %s', (label, configFile) => {
      describe('テキスト値の埋め込み', () => {
        it.each([target1, target3, target4])('一か所の埋め込み: %s', (target) => {
          const doc = YAML.parseDocument(configFile);
          embedValue(doc, target, textValue);
          const paths = (isV2Format(configFile) ? `config.${target}` : target).split('.');
          expect(doc.getIn(paths)).toBe(textValue);
        });

        it('複数個所の埋め込み', () => {
          const target = target2;
          const doc = YAML.parseDocument(configFile);
          embedValue(doc, target, textValue);
          const paths = target.split('.').slice(1);
          SERVICES.forEach((srv) => {
            expect(doc.getIn(
              isV2Format(configFile) ? ['config', srv].concat(paths) : [srv].concat(paths),
            )).toBe(textValue);
          });
        });
      });

      describe('バイナリ値の埋め込み', () => {
        it.each([target1, target3, target4])('一か所の埋め込み: %s', (target) => {
          const doc = YAML.parseDocument(configFile, { customTags: [binaryTag] });
          embedValue(doc, target, binaryValue);
          const paths = (isV2Format(configFile) ? `config.${target}` : target).split('.');
          expect(doc.getIn(paths)).toBe(binaryValue);
        });

        it('複数個所の埋め込み', () => {
          const target = target2;
          const doc = YAML.parseDocument(configFile, { customTags: [binaryTag] });
          embedValue(doc, target, binaryValue);
          const paths = target.split('.').slice(1);
          SERVICES.forEach((srv) => {
            expect(doc.getIn(
              isV2Format(configFile) ? ['config', srv].concat(paths) : [srv].concat(paths),
            )).toBe(binaryValue);
          });
        });
      });
    });

    describe('秘匿情報', () => {
      describe('v2', () => {
        const configFile = configFileV2();
        it.each([target1, target3, target4])('一か所の埋め込み: %s', (target) => {
          const doc = YAML.parseDocument(configFile, { customTags: [sinetstreamEncrypt] });
          embedSecret(
            doc, target, Buffer.from(binaryValue, 'base64'),
            { publicKey: pubKey, fingerprint },
          );
          const paths = `config.${target}`.split('.');
          const sec = doc.getIn(paths) as SecretData;
          expect(sec.decrypt(privKey).toString('base64')).toBe(binaryValue);
        });

        it('複数個所の埋め込み', () => {
          const target = target2;
          const doc = YAML.parseDocument(configFile, { customTags: [binaryTag] });
          embedValue(doc, target, binaryValue);
          const paths = target.split('.').slice(1);
          SERVICES.forEach((srv) => {
            expect(doc.getIn(['config', srv].concat(paths))).toBe(binaryValue);
          });
        });
      });

      it.each([target1, target2, target3, target4])('v1: %s', async (target) => {
        expect.assertions(1);
        const doc = YAML.parseDocument(configFileV1());
        await expect(async () => {
          embedSecret(
            doc, target, Buffer.from(binaryValue, 'base64'),
            { publicKey: pubKey, fingerprint },
          );
        }).rejects.toThrowError(IllegalArgument);
      });
    });
  });

  describe('埋め込み先の指定が正しくない場合', () => {
    const configFile = configFileV2();
    it.each([
      '', ' ', 'x', '*', '*abc.zzz', 'abc*.zzz', 'abc..zzz', 'abc..',
    ])('埋め込み先指定文字列が正しくない場合: "%s"', async (target) => {
      expect.assertions(1);
      const doc = YAML.parseDocument(configFile);
      await expect(async () => {
        embedValue(doc, target, textValue);
      }).rejects.toThrowError(IllegalArgument);
    });

    it('埋め込み先に Scalar 以外の値が設定されていた場合', () => {
      const target = targetX1;
      const doc = YAML.parseDocument(configFile);
      embedValue(doc, target, textValue);
      const paths = (isV2Format(configFile) ? `config.${target}` : target).split('.');
      expect(doc.getIn(paths)).toBe(textValue);
    });

    it('途中のノードに Map 以外の値が設定されていた場合', async () => {
      expect.assertions(1);
      const doc = YAML.parseDocument(configFile);
      await expect(async () => {
        embedValue(doc, targetX2, textValue);
      }).rejects.toThrowError(BadFileFormat);
    });
  });

  beforeAll(async () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    pubKey = publicKey;
    privKey = privateKey;
    const pkcs1 = pubKey.export({ type: 'pkcs1', format: 'pem' });
    fingerprint = sshpk.parseKey(pkcs1, 'auto').fingerprint('sha256').toString();
  });
});
