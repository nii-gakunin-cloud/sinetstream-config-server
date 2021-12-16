import { NotAuthenticated } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { params, method, data } = context;
  const { user } = params;
  if (!user) {
    throw new NotAuthenticated();
  }
  if (method === 'create') {
    data.createdUser = user.id;
  }
  data.updatedUser = user.id;
  return context;
};
