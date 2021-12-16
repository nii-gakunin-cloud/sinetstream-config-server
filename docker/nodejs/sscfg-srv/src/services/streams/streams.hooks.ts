import * as authentication from '@feathersjs/authentication';
import { disallow, iff } from 'feathers-hooks-common';
import addInitialMember from '../../hooks/add-initial-member';
import isExternal from '../../hooks/is-external';
import makeNameUnchangeable from '../../hooks/make-name-unchangeable';
import membersOnly from '../../hooks/members-only';
import mustBeAdministrator from '../../hooks/must-be-administrator';
import populateTopics from '../../hooks/populate-topics';
import processStream, { cleanupSecrets, prepareCleanupSecrets } from '../../hooks/process-stream';
import recordEditedUser from '../../hooks/record-edited-user';
import setupPaginate from '../../hooks/setup-paginate';
import { commit as transactionCommit, rollback as transactionRollback, start as transactionStart } from '../../hooks/transaction';
import validateStreamName from '../../hooks/validate-stream-name';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
  before: {
    all: [authenticate('jwt')],
    find: [
      iff(isExternal(), membersOnly()),
      setupPaginate(),
    ],
    get: [iff(isExternal(), membersOnly())],
    create: [
      transactionStart(),
      recordEditedUser(),
      validateStreamName(),
      populateTopics(),
    ],
    update: [disallow()],
    patch: [
      transactionStart(),
      makeNameUnchangeable(),
      iff(isExternal(), mustBeAdministrator()),
      recordEditedUser(),
      populateTopics(),
    ],
    remove: [
      transactionStart(),
      iff(isExternal(), mustBeAdministrator()),
      prepareCleanupSecrets(),
    ],
  },

  after: {
    all: [],
    find: [iff(isExternal(), processStream())],
    get: [iff(isExternal(), processStream())],
    create: [addInitialMember(), transactionCommit()],
    update: [],
    patch: [transactionCommit()],
    remove: [
      cleanupSecrets(),
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
