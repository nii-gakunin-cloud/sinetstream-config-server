import { Hook, HookContext } from '@feathersjs/feathers';
import { transaction as trans } from 'objection';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const start = (options = {}): Hook => async (context: HookContext): Promise<HookContext> => {
  const { service } = context;
  const { Model } = service;
  const trx = await trans.start(Model);
  context.params.transaction = { trx };
  return context;
};

// eslint-disable-next-line arrow-body-style,@typescript-eslint/no-unused-vars
export const commit = (options = {}): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const { transaction } = context.params;
    await transaction.trx.commit();
    return context;
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const rollback = (options = {}): Hook => async (context: HookContext): Promise<void> => {
  const { transaction } = context.params;
  await transaction.trx.rollback();
};
