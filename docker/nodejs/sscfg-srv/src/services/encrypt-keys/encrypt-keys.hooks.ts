import * as authentication from '@feathersjs/authentication';
import {
  disallow, discard, iff, preventChanges, required,
} from 'feathers-hooks-common';
import isExternal from '../../hooks/is-external';
import { adminMembersOnly } from '../../hooks/members-only';
import mustBeAdministrator from '../../hooks/must-be-administrator';
import processEncryptKeys from '../../hooks/process-encrypt-keys';
import recordEditedUser from '../../hooks/record-edited-user';
import setupPaginate from '../../hooks/setup-paginate';
import { commit as transactionCommit, rollback as transactionRollback, start as transactionStart } from '../../hooks/transaction';
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
      transactionStart(),
      required('target'),
      discard('version'),
      iff(isExternal(), mustBeAdministrator()),
      processEncryptKeys(),
      recordEditedUser(),
    ],
    update: [disallow()],
    patch: [
      transactionStart(),
      preventChanges(true, 'stream_id', 'version', 'target', 'size', 'key'),
      iff(isExternal(), mustBeAdministrator()),
      processEncryptKeys(),
      recordEditedUser(),
    ],
    remove: [disallow()],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [processEncryptKeys(), transactionCommit()],
    update: [],
    patch: [processEncryptKeys(), transactionCommit()],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [transactionRollback()],
    update: [],
    patch: [transactionRollback()],
    remove: [],
  },
};
