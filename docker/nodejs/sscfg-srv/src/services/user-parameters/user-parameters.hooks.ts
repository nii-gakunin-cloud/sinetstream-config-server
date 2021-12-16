import * as authentication from '@feathersjs/authentication';
import {
  disallow, discard, iff, preventChanges, required,
} from 'feathers-hooks-common';
import isExternal from '../../hooks/is-external';
import { adminMembersOnly } from '../../hooks/members-only';
import mustBeAdministrator from '../../hooks/must-be-administrator';
import processContent, { filterBinaryContent } from '../../hooks/process-content';
import processUserParameters, { postProcessingContent } from '../../hooks/process-user-parameters';
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
      required('target', 'stream_id', 'user_id'),
      iff(isExternal(), mustBeAdministrator()),
      discard('isBinary'),
      processContent(),
      required('content'),
      processUserParameters(),
      recordEditedUser(),
    ],
    update: [disallow()],
    patch: [
      transactionStart(),
      preventChanges(true, 'stream_id', 'user_id'),
      iff(isExternal(), mustBeAdministrator()),
      discard('isBinary'),
      processContent(),
      processUserParameters(),
      recordEditedUser(),
    ],
    remove: [
      transactionStart(),
      iff(isExternal(), mustBeAdministrator()),
    ],
  },

  after: {
    all: [],
    find: [iff(isExternal(), filterBinaryContent())],
    get: [iff(isExternal(), filterBinaryContent())],
    create: [
      processUserParameters(),
      iff(isExternal(), postProcessingContent()),
      transactionCommit(),
    ],
    update: [],
    patch: [
      processUserParameters(),
      iff(isExternal(), postProcessingContent()),
      transactionCommit(),
    ],
    remove: [
      processUserParameters(),
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
