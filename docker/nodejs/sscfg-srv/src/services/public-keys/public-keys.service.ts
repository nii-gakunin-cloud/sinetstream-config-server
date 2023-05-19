// Initializes the `public-keys` service on path `/public-keys`
import { ServiceAddons } from '@feathersjs/feathers';
import { Knex } from 'knex';
import { Application } from '../../declarations';
import createModel from '../../models/public-keys.model';
import { PublicKeys } from './public-keys.class';
import hooks from './public-keys.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'public-keys': PublicKeys & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    whitelist: ['$eager', '$joinEager', '$like'],
    allowEager: 'user',
    allowedInsert: 'user',
    allowedUpsert: 'user',
    insertGraphOptions: { relate: true },
    eagerFilters: [
      {
        expression: 'user',
        filter: (builder: Knex.QueryBuilder) => {
          builder.select('name', 'email', 'displayName');
        },
      },
    ],
    multi: true,
  };

  // Initialize our service with any options it requires
  app.use('/public-keys', new PublicKeys(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('public-keys');

  service.hooks(hooks);
}
