// Initializes the `encrypt-keys` service on path `/encrypt-keys`
import { ServiceAddons } from '@feathersjs/feathers';
import { QueryBuilder } from 'knex';
import { Application } from '../../declarations';
import createModel from '../../models/encrypt-keys.model';
import { EncryptKeys } from './encrypt-keys.class';
import hooks from './encrypt-keys.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'encrypt-keys': EncryptKeys & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    whitelist: ['$eager', '$joinEager'],
    allowEager: '[stream, user, latestVersion]',
    eagerFilters: [
      {
        expression: 'stream',
        filter: (builder: QueryBuilder) => {
          builder.select('name', 'comment');
        },
      },
      {
        expression: 'user',
        filter: (builder: QueryBuilder) => {
          builder.select('name', 'displayName', 'avatar');
        },
      },
      {
        expression: 'latestVersion',
        filter: (builder: QueryBuilder) => {
          builder.select('ver');
        },
      },
    ],
    multi: true,
  };

  // Initialize our service with any options it requires
  app.use('/encrypt-keys', new EncryptKeys(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('encrypt-keys');

  service.hooks(hooks);
}
