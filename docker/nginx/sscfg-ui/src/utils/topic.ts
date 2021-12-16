import YAML from 'yaml';

const extractTopics = (txt: string): string[] => {
  const cfg = YAML.parseDocument(txt);
  const version = cfg.getIn(['header', 'version']);
  const servicePath = version === 2 ? ['config'] : [];
  const services = cfg.getIn(servicePath);
  if (services?.type !== 'MAP') {
    return [];
  }
  return services.items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((x: any) => x.key.toString())
    .map((x: string) => Array.of(...servicePath, x, 'topic'))
    .map((paths: string[]) => (cfg.getIn(paths)))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((x: any) => x != null);
};

export default extractTopics;
