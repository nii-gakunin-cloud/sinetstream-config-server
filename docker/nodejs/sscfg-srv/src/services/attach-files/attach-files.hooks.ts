import * as authentication from '@feathersjs/authentication';
import {
  disallow, discard, iff, preventChanges, required,
} from 'feathers-hooks-common';
import isExternal from '../../hooks/is-external';
import { adminMembersOnly } from '../../hooks/members-only';
import mustBeAdministrator from '../../hooks/must-be-administrator';
import processAttachFiles from '../../hooks/process-attach-files';
import recordEditedUser from '../../hooks/record-edited-user';
import setupPaginate from '../../hooks/setup-paginate';
import { commit as transactionCommit, rollback as transactionRollback, start as transactionStart } from '../../hooks/transaction';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
  before: {
    all: [authenticate('jwt')],
    find: [iff(isExternal(), adminMembersOnly()), setupPaginate()],
    get: [iff(isExternal(), adminMembersOnly())],
    create: [
      transactionStart(),
      required('content', 'target'),
      iff(isExternal(), mustBeAdministrator()),
      processAttachFiles(),
      recordEditedUser(),
    ],
    update: [disallow()],
    patch: [
      transactionStart(),
      preventChanges(true, 'stream_id'),
      iff(isExternal(), mustBeAdministrator()),
      processAttachFiles(),
      recordEditedUser(),
    ],
    remove: [
      transactionStart(),
      iff(isExternal(), mustBeAdministrator()),
    ],
  },

  after: {
    all: [],
    find: [iff(isExternal(), discard('content'))],
    get: [iff(isExternal(), discard('content'))],
    create: [
      processAttachFiles(),
      iff(isExternal(), discard('content')),
      transactionCommit(),
    ],
    update: [],
    patch: [
      processAttachFiles(),
      iff(isExternal(), discard('content')),
      transactionCommit(),
    ],
    remove: [
      processAttachFiles(),
      transactionCommit(),
    ],
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
