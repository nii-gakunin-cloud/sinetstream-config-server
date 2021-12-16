import { BadRequest } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const {
    id, data, params, method, service,
  } = context;
  if (!(method === 'update' || method === 'patch') || id == null) {
    return context;
  }
  if ('name' in data) {
    const { user, transaction } = params;
    const current = await service.get(id, { user, transaction });
    if (current.name !== data.name) {
      throw new BadRequest('Name changes are not permitted.');
    }
  }
  return context;
};
