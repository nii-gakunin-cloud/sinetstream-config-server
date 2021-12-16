import * as authentication from '@feathersjs/authentication';
import {
  disallow, iff, preventChanges, required,
} from 'feathers-hooks-common';
import isExternal from '../../hooks/is-external';
import { onlyMyself } from '../../hooks/members-only';
import processPublicKey from '../../hooks/process-public-key';
import setupPaginate from '../../hooks/setup-paginate';
import { commit as transactionCommit, rollback as transactionRollback, start as transactionStart } from '../../hooks/transaction';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
  before: {
    all: [authenticate('jwt')],
    find: [iff(isExternal(), onlyMyself()), setupPaginate()],
    get: [iff(isExternal(), onlyMyself())],
    create: [
      transactionStart(),
      required('publicKey'),
      processPublicKey(),
    ],
    update: [disallow()],
    patch: [
      transactionStart(),
      preventChanges(true, 'publicKey', 'fingerprint', 'user_id'),
      iff(isExternal(), processPublicKey()),
    ],
    remove: [
      transactionStart(),
      onlyMyself(),
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [processPublicKey(), transactionCommit()],
    update: [],
    patch: [iff(isExternal(), processPublicKey()), transactionCommit()],
    remove: [processPublicKey(), transactionCommit()],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [transactionRollback()],
    update: [],
    patch: [transactionRollback()],
    remove: [transactionRollback()],
  },
};
