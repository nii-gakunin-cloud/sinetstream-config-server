import * as authentication from '@feathersjs/authentication';
import { disallow, discard, iff } from 'feathers-hooks-common';
import isExternal from '../../hooks/is-external';
import { onlyMyself } from '../../hooks/members-only';
import populateUserId from '../../hooks/populate-user-id';
import processAccessKeys from '../../hooks/process-access-keys';
import processAccessKeysQuery from '../../hooks/process-access-keys-query';
import setupPaginate from '../../hooks/setup-paginate';
import { commit as transactionCommit, rollback as transactionRollback, start as transactionStart } from '../../hooks/transaction';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
  before: {
    all: [authenticate('jwt')],
    find: [
      iff(isExternal(), onlyMyself()),
      setupPaginate(),
      processAccessKeysQuery(),
    ],
    get: [
      iff(isExternal(), onlyMyself()),
      processAccessKeysQuery(),
    ],
    create: [
      transactionStart(),
      populateUserId(),
      processAccessKeys(),
    ],
    update: [disallow()],
    patch: [disallow()],
    remove: [
      transactionStart(),
      iff(isExternal(), onlyMyself()),
    ],
  },

  after: {
    all: [],
    find: [
      processAccessKeysQuery(),
      discard('expiration'),
    ],
    get: [
      processAccessKeysQuery(),
      discard('expiration'),
    ],
    create: [
      processAccessKeys(),
      transactionCommit(),
    ],
    update: [],
    patch: [],
    remove: [
      processAccessKeys(),
      transactionCommit(),
    ],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [transactionRollback()],
    update: [],
    patch: [],
    remove: [transactionRollback()],
  },
};
