/* eslint-disable @typescript-eslint/no-explicit-any */
import YAML, { Pair, Scalar, YAMLMap } from 'yaml';

const extractTopics = (txt: string): string[] => {
  const cfg = YAML.parseDocument(txt);
  const version = cfg.getIn(['header', 'version']);
  const servicePath = version === 2 ? ['config'] : [];
  const services = cfg.getIn(servicePath) as any;
  if (!(services instanceof YAMLMap)) {
    return [];
  }
  return services.items
    .map((x: Pair<Scalar, any>) => x.key.toString())
    .map((x: string) => Array.of(...servicePath, x, 'topic'))
    .map((paths: string[]) => (cfg.getIn(paths) as any))
    .filter((x: any) => x != null && typeof x !== 'object')
    .map((x: any) => x.toString());
};

export default extractTopics;
