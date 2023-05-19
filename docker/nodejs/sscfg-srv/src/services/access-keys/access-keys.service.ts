// Initializes the `access-keys` service on path `/access-keys`
import { ServiceAddons } from '@feathersjs/feathers';
import { Knex } from 'knex';
import { Application } from '../../declarations';
import createModel from '../../models/access-keys.model';
import { AccessKeys } from './access-keys.class';
import hooks from './access-keys.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'access-keys': AccessKeys & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    whitelist: ['$eager', '$joinEager', '$null', '$all'],
    allowEager: '[streams, expiration]',
    allowedInsert: 'streams',
    insertGraphOptions: { relate: true },
    eagerFilters: [
      {
        expression: 'streams',
        filter: (builder: Knex.QueryBuilder) => {
          builder.select('id', 'name', 'comment', 'configFile');
        },
      },
      {
        expression: 'expiration',
        filter: (builder: Knex.QueryBuilder) => {
          builder.select('expirationTime');
        },
      },
    ],
  };

  // Initialize our service with any options it requires
  app.use('/access-keys', new AccessKeys(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('access-keys');

  service.hooks(hooks);
}
