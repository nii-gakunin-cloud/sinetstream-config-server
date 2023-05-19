// Initializes the `user-parameters` service on path `/user-parameters`
import { ServiceAddons } from '@feathersjs/feathers';
import { Knex } from 'knex';
import { Application } from '../../declarations';
import createModel from '../../models/user-parameters.model';
import { UserParameters } from './user-parameters.class';
import hooks from './user-parameters.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'user-parameters': UserParameters & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    whitelist: ['$eager', '$joinEager'],
    allowEager: '[stream, user]',
    eagerFilters: [
      {
        expression: 'stream',
        filter: (builder: Knex.QueryBuilder) => {
          builder.select('name', 'comment');
        },
      },
      {
        expression: 'user',
        filter: (builder: Knex.QueryBuilder) => {
          builder.select('name', 'displayName', 'avatar');
        },
      },
    ],
    multi: true,
  };

  // Initialize our service with any options it requires
  app.use('/user-parameters', new UserParameters(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('user-parameters');

  service.hooks(hooks);
}
