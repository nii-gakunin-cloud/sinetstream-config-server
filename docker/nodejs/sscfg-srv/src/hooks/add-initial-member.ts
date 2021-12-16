import { NotAuthenticated } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';
import { Streams } from '../models/streams.model';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const {
    params, method, app, result: stream,
  } = context;
  const { user, transaction } = params;
  if (!user) {
    throw new NotAuthenticated();
  }
  if (method === 'create' && stream instanceof Streams) {
    const member = {
      admin: true,
      user,
      stream,
    };
    const members = [await app.service('members').create(member, { user, transaction })];
    context.result = { ...stream, admin: true, members };
  }
  return context;
};
