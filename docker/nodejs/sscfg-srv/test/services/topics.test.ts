import { Params } from '@feathersjs/feathers';
import knex from 'knex';
import { Streams } from '../../src/models/streams.model';
import app from '../../src/app';
import { Users } from '../../src/models/users.model';

describe('\'topics\' service', () => {
  let db: knex;
  const service = app.service('topics');
  const streamService = app.service('streams');
  let user: Users;
  let params: Params;
  const name = 'config-001';
  const topic1 = 'topic-kafka-001';
  const topic2 = 'topic-mqtt-002';
  const topic3 = 'topic-xxx-003';
  const topic4 = 'topic-zzz-004';
  const configFile1 = (topic: string) => (`
kafka-service:
  type: kafka
  brokers: kafka0.example.org
  topic: ${topic}
  `);
  const configFile2 = (topicA: string, topicB: string) => (`
kafka-service:
  type: kafka
  brokers: kafka0.example.org
  topic: ${topicA}
mqtt-service:
  type: mqtt
  brokers: mqtt.example.org
  topic: ${topicB}
  `);
  const badConfigFile = (topic: string) => (`
kafka-service:
  type: kafka: x
 brokers: kafka0.example.org
  topic: ${topic}
  `);
  const configFile0 = () => (`
kafka-service:
  type: kafka
  brokers: kafka0.example.org
  `);

  describe('コンフィグ情報の登録', () => {
    it('設定ファイルにトピック名が一つある場合', async () => {
      const topic = topic1;
      const stream = await streamService.create(
        { name, configFile: configFile1(topic) }, { ...params },
      );
      const ret = await service.find({ ...params, paginate: false });
      expect(ret).toMatchObject([{ name: topic, stream_id: stream.id }]);
    });

    it('設定ファイルにトピック名が二つある場合', async () => {
      const topics: [string, string] = [topic1, topic2];
      const stream = await streamService.create(
        { name, configFile: configFile2(...topics) }, { ...params },
      );
      const ret = await service.find({ ...params, paginate: false });
      expect(ret).toMatchObject(
        topics.map((topic) => ({ name: topic, stream_id: stream.id })),
      );
    });

    it('設定ファイルのトピック名が重複している場合', async () => {
      const topic = topic1;
      const stream = await streamService.create(
        { name, configFile: configFile2(topic, topic) }, { ...params },
      );
      const ret = await service.find({ ...params, paginate: false });
      expect(ret).toMatchObject([{ name: topic, stream_id: stream.id }]);
    });

    it('設定ファイルにトピック名がない場合', async () => {
      await streamService.create(
        { name, configFile: configFile0() }, { ...params },
      );
      const ret = await service.find({ ...params, paginate: false });
      expect(ret).toHaveLength(0);
    });

    it('設定ファイルが構文エラーとなる場合', async () => {
      await streamService.create(
        { name, configFile: badConfigFile(topic1) }, { ...params },
      );
      const ret = await service.find({ ...params, paginate: false });
      expect(ret).toHaveLength(0);
    });

    it('設定ファイルが空の場合', async () => {
      await streamService.create({ name }, { ...params });
      const ret = await service.find({ ...params, paginate: false });
      expect(ret).toHaveLength(0);
    });
  });

  describe('コンフィグ情報の変更', () => {
    let stream: Streams;

    describe('設定ファイルのトピック名が変更された場合', () => {
      it.each([
        [topic3, topic2],
        [topic3, topic4],
      ])('(%s, %s)', async (topicA, topicB) => {
        const topics: [string, string] = [topicA, topicB];
        await streamService.patch(
          stream.id,
          { configFile: configFile2(...topics) },
          { ...params },
        );
        const ret = await service.find({ ...params, paginate: false });
        expect(ret).toMatchObject(
          topics.map((topic) => ({ name: topic, stream_id: stream.id })),
        );
      });

      beforeEach(async () => {
        stream = await streamService.create(
          { name, configFile: configFile2(topic1, topic2) }, { ...params },
        );
      });
    });

    describe('設定ファイルのトピック名が追加された場合', () => {
      it.each([
        [topic1, topic2],
        [topic3, topic4],
      ])('(%s, %s)', async (topicA, topicB) => {
        const topics: [string, string] = [topicA, topicB];
        await streamService.patch(
          stream.id,
          { configFile: configFile2(...topics) },
          { ...params },
        );
        const ret = await service.find({ ...params, paginate: false });
        expect(ret).toMatchObject(
          topics.map((topic) => ({ name: topic, stream_id: stream.id })),
        );
      });

      beforeEach(async () => {
        stream = await streamService.create(
          { name, configFile: configFile1(topic1) }, { ...params },
        );
      });
    });

    describe('登録されていたトピック名がクリアされる場合', () => {
      describe('設定ファイルのトピック名が削除された場合', () => {
        it('ひとつのトピック名を削除', async () => {
          const topic = topic1;
          await streamService.patch(
            stream.id,
            { configFile: configFile1(topic) },
            { ...params },
          );
          const ret = await service.find({ ...params, paginate: false });
          expect(ret).toMatchObject([{ name: topic, stream_id: stream.id }]);
        });

        it('全てのトピック名を削除', async () => {
          await streamService.patch(
            stream.id,
            { configFile: configFile0() },
            { ...params },
          );
          const ret = await service.find({ ...params, paginate: false });
          expect(ret).toHaveLength(0);
        });
      });

      it('変更後の設定ファイルが空の場合', async () => {
        await streamService.patch(
          stream.id,
          { configFile: '' },
          { ...params },
        );
        const ret = await service.find({ ...params, paginate: false });
        expect(ret).toHaveLength(0);
      });

      it('変更後の設定ファイルが構文エラーとなる場合', async () => {
        await streamService.patch(
          stream.id,
          { configFile: badConfigFile(topic1) },
          { ...params },
        );
        const ret = await service.find({ ...params, paginate: false });
        expect(ret).toHaveLength(0);
      });

      beforeEach(async () => {
        stream = await streamService.create(
          { name, configFile: configFile2(topic1, topic2) }, { ...params },
        );
      });
    });
  });

  describe('コンフィグ情報の削除', () => {
    let stream: Streams;

    describe.each([
      ['削除対象の設定ファイルにトピック名が一つある場合', configFile1(topic1)],
      ['削除対象の設定ファイルにトピック名が複数ある場合', configFile2(topic1, topic2)],
      ['削除対象の設定ファイルのトピック名が重複している場合', configFile2(topic1, topic1)],
      ['削除対象の設定ファイルにトピック名がない場合', configFile0()],
      ['削除対象の設定ファイルが構文エラーとなる場合', badConfigFile(topic1)],
    ])('設定ファイルが登録されている場合', (lbl, configFile) => {
      it(lbl, async () => {
        await streamService.remove(stream.id, { ...params });
        const ret = await service.find({ ...params, paginate: false });
        expect(ret).toHaveLength(0);
      });

      beforeEach(async () => {
        stream = await streamService.create({ name, configFile }, { ...params });
      });
    });

    describe('削除対象の設定ファイルが空の場合', () => {
      it('削除の実行', async () => {
        await streamService.remove(stream.id, { ...params });
        const ret = await service.find({ ...params, paginate: false });
        expect(ret).toHaveLength(0);
      });

      beforeEach(async () => {
        stream = await streamService.create({ name }, { ...params });
      });
    });
  });

  const userInfo = {
    name: 'admin@example.com',
  };

  beforeEach(async () => {
    await db('streams').del();
    const test = { jest: true };
    params = { user, test };
  });

  beforeAll(async () => {
    db = app.get('knex');
    await db('members').del();
    await db('streams').del();
    await db('users').del();
    await db('users').insert(userInfo);
    [user] = ((await app.service('users').find({ query: { name: userInfo.name } })) as Users[]);
  });

  afterAll(async () => {
    await db('members').del();
    await db('streams').del();
    await db('users').del();
  });
});
