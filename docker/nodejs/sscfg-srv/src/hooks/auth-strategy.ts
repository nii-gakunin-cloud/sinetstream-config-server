import { Forbidden } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';

export default (
  ...strategies: string[]
): Hook => async (context: HookContext): Promise<HookContext> => {
  const { strategy } = context?.params?.authentication?.payload ?? {};
  if (!strategies.includes(strategy)) {
    throw new Forbidden();
  }
  return context;
};
