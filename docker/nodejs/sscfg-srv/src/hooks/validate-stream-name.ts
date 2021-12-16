import { BadRequest } from '@feathersjs/errors';
import { Hook, HookContext } from '@feathersjs/feathers';

function validateStreamName(name: string): void {
  if (!/^[A-Za-z][-.\w]*$/.test(name)) {
    throw new BadRequest('Invalid name');
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { data, method } = context;
  if (method !== 'create') {
    return context;
  }
  const { name } = data;
  validateStreamName(name);
  return context;
};
