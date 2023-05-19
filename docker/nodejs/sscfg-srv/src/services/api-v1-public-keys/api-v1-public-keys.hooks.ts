import * as authentication from '@feathersjs/authentication';
import { discard } from 'feathers-hooks-common';
import strategy from '../../hooks/auth-strategy';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
  before: {
    all: [authenticate('jwt'), strategy('api-access')],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [discard('user_id', 'user')],
    get: [discard('user_id', 'user')],
    create: [discard('user_id')],
    update: [],
    patch: [discard('user_id')],
    remove: [discard('user_id')],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
