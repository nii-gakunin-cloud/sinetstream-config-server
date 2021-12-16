import { Hook, HookContext } from '@feathersjs/feathers';
import { checkContext, getItems, replaceItems } from 'feathers-hooks-common';
import YAML from 'yaml';
import { getTopics } from '../utils/sinetstreamConfigFile';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  checkContext(context, 'before', ['create', 'patch', 'update']);
  const item = getItems(context);
  const { configFile } = item;
  if (!(configFile != null && typeof configFile === 'string' && configFile.trim().length > 0)) {
    replaceItems(context, { ...item, topics: [] });
    return context;
  }
  try {
    const doc = YAML.parseDocument(configFile);
    const topics = [...new Set(getTopics(doc))].map((name) => ({ name }));
    replaceItems(context, { ...item, topics });
  } catch (e) {
    replaceItems(context, { ...item, topics: [] });
    return context;
  }
  return context;
};
