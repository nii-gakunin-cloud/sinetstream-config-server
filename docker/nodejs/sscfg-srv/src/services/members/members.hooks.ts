import * as authentication from '@feathersjs/authentication';
import { disallow, iff, preventChanges } from 'feathers-hooks-common';
import isExternal from '../../hooks/is-external';
import { adminMembersOnly, exceptMyself } from '../../hooks/members-only';
import mustBeAdministrator from '../../hooks/must-be-administrator';
import recordEditedUser from '../../hooks/record-edited-user';
import setupPaginate from '../../hooks/setup-paginate';
import { commit as transactionCommit, rollback as transactionRollback, start as transactionStart } from '../../hooks/transaction';
import updateVaultPolicy from '../../hooks/update-vault-policy';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
  before: {
    all: [authenticate('jwt')],
    find: [
      iff(isExternal(), adminMembersOnly()),
      setupPaginate(),
    ],
    get: [iff(isExternal(), adminMembersOnly())],
    create: [
      iff(isExternal(), transactionStart()),
      iff(isExternal(), mustBeAdministrator()),
      recordEditedUser(),
    ],
    update: [disallow()],
    patch: [
      iff(isExternal(), transactionStart()),
      iff(isExternal(), mustBeAdministrator()),
      preventChanges(true, 'user_id', 'stream_id'),
      recordEditedUser(),
    ],
    remove: [
      iff(isExternal(), transactionStart()),
      iff(isExternal(), mustBeAdministrator()),
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      updateVaultPolicy(),
      iff(isExternal(), transactionCommit()),
    ],
    update: [],
    patch: [
      iff(isExternal(), exceptMyself()),
      updateVaultPolicy(),
      iff(isExternal(), transactionCommit()),
    ],
    remove: [
      iff(isExternal(), exceptMyself()),
      updateVaultPolicy(),
      iff(isExternal(), transactionCommit()),
    ],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [
      iff(isExternal(), transactionRollback()),
    ],
    update: [],
    patch: [
      iff(isExternal(), transactionRollback()),
    ],
    remove: [
      iff(isExternal(), transactionRollback()),
    ],
  },
};
