import { HookContext } from '@feathersjs/feathers';
import feathersClient, { BaseModel, makeServicePlugin } from '@/feathers-client';

class Stream extends BaseModel {
  static modelName = 'Stream'

  static instanceDefaults() {
    return {
      comment: '',
      configFile: `
# これは設定ファイルの例です。実際の環境に応じた記述内容に修正してください。
service-kafka-001:
  type: kafka
  brokers:
    - kafka0.example.org:9092
    - kafka1.example.org:9092
    - kafka2.example.org:9092
  topic: topic-kafka-001
  consitency: AT_LEAST_ONCE
  value_type: text

service-mqtt-001:
  type: mqtt
  brokers: mqtt.example.org:1883
  topic: topic-mqtt-001
  consitency: AT_LEAST_ONCE
  value_type: text
`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static diffOnPatch(data: { [key: string]: any}): {[key:string]: any} {
    const { comment, configFile } = data;
    return { comment, configFile };
  }
}

const eagerMember = async (context: HookContext) => {
  const { params } = context;
  const query = { $joinEager: 'members' };
  params.query = { ...query, ...params.query };
  return context;
};

const servicePath = 'streams';

const servicePlugin = makeServicePlugin({
  Model: Stream,
  service: feathersClient.service(servicePath),
  servicePath,
});

feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [eagerMember],
    get: [eagerMember],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
});

export default servicePlugin;
