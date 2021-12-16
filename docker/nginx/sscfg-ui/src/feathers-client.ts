import auth from '@feathersjs/authentication-client';
import feathers from '@feathersjs/feathers';
import rest from '@feathersjs/rest-client';
import { discard, iff } from 'feathers-hooks-common';
import feathersVuex from 'feathers-vuex';

const restClient = process.env.VUE_APP_FEATHERS_URL != null
  ? rest(process.env.VUE_APP_FEATHERS_URL)
  : rest();

const feathersClient = feathers()
  .configure(restClient.fetch(window.fetch))
  .configure(auth({ storage: window.localStorage }))
  .hooks({
    before: {
      all: [
        iff(
          (context) => ['create', 'update', 'patch'].includes(context.method),
          discard('__id', '__isTemp'),
        ),
      ],
    },
  });

export default feathersClient;

// Setting up feathers-vuex
const {
  makeServicePlugin,
  makeAuthPlugin,
  BaseModel,
  models,
  FeathersVuex,
} = feathersVuex(feathersClient, {
  serverAlias: 'api', // optional for working with multiple APIs (this is the default value)
  idField: 'id', // Must match the id field in your database table/collection
  whitelist: ['$regex', '$options'],
});

export {
  makeAuthPlugin, makeServicePlugin, BaseModel, models, FeathersVuex,
};
