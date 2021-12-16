import { BadRequest, Forbidden, NotAuthenticated } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';

async function getStreamId(context: HookContext): Promise<Record<string, number>> {
  const { data, id, path } = context;
  if (id != null) {
    if (path === 'streams') {
      if (typeof id === 'string') {
        return { streamId: parseInt(id, 10) };
      }
      return { streamId: id };
    }
    const { app, params } = context;
    const { user, transaction } = params;
    const { stream_id: streamId } = await app.service(path).get(id, { user, transaction });
    return { streamId };
  }
  if (data != null) {
    const { stream_id: streamId, stream } = data;
    if (streamId != null) {
      return { streamId };
    }
    if (stream != null) {
      return { streamId: stream.id };
    }
  }
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { app, params, method } = context;
  if (method === 'find' || method === 'get') {
    return context;
  }
  const { user, transaction } = params;
  if (user == null) {
    throw new NotAuthenticated();
  }

  const { streamId } = await getStreamId(context);
  if (streamId == null) {
    throw new BadRequest();
  }

  const members = await app.service('members').find({
    query: {
      admin: true,
      stream_id: streamId,
      user_id: user.id,
      $limit: 0,
    },
    paginate: app.get('paginate'),
    user,
    transaction,
  });
  if (members.total === 0) {
    throw new Forbidden();
  }
  return context;
};
