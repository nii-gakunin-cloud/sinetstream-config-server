import * as feathersAuthentication from '@feathersjs/authentication';
import {
  disallow, discard, every, iff, isNot, preventChanges, softDelete, some,
} from 'feathers-hooks-common';
import addQueryAllowedUser, { checkSearchCriteria, isMyself, isSystemAdmin } from '../../hooks/add-query-allowed-user';
import isExternal from '../../hooks/is-external';
import populateAvatar from '../../hooks/populate-avatar';
import processUsers, { isChangePassword } from '../../hooks/process-users';
import { commit as transactionCommit, rollback as transactionRollback, start as transactionStart } from '../../hooks/transaction';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = feathersAuthentication.hooks;

export default {
  before: {
    all: [authenticate('jwt')],
    find: [
      iff(every(isExternal(), isNot(checkSearchCriteria)), disallow()),
      softDelete({}),
    ],
    get: [softDelete({})],
    create: [
      transactionStart(),
      softDelete({}),
      iff(isNot(isSystemAdmin), disallow()),
      discard('isLocalUser'),
      processUsers(),
      populateAvatar(),
    ],
    update: [disallow()],
    patch: [
      iff(isChangePassword(), transactionStart()),
      softDelete({}),
      preventChanges(true, 'name', 'isLocalUser'),
      iff(some(isNot(isSystemAdmin), isMyself), preventChanges(true, 'systemAdmin')),
      addQueryAllowedUser(),
      processUsers(),
      populateAvatar(),
    ],
    remove: [
      transactionStart(),
      iff(some(isNot(isSystemAdmin), isMyself), disallow()),
      softDelete({}),
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [processUsers(), transactionCommit()],
    update: [],
    patch: [
      processUsers(),
      iff(isChangePassword(), transactionCommit()),
    ],
    remove: [processUsers(), transactionCommit()],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [transactionRollback()],
    update: [],
    patch: [iff(isChangePassword(), transactionRollback())],
    remove: [transactionRollback()],
  },
};
