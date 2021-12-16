import { Hook, HookContext } from '@feathersjs/feathers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { params } = context;
  if (params.paginate != null) {
    return context;
  }
  if (params.query?.$limit != null) {
    context.params = { ...params, paginate: context.app.get('paginate') };
  }
  return context;
};
