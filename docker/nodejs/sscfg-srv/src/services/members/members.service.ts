// Initializes the `members` service on path `/members`
import { ServiceAddons } from '@feathersjs/feathers';
import { QueryBuilder } from 'knex';
import { Application } from '../../declarations';
import createModel from '../../models/members.model';
import { Members } from './members.class';
import hooks from './members.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'members': Members & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    whitelist: ['$eager', '$joinEager'],
    allowEager: '[user, stream]',
    allowedInsert: '[user, stream]',
    allowedUpsert: '[user, stream]',
    insertGraphOptions: { relate: true },
    eagerFilters: [
      {
        expression: 'user',
        filter: (builder: QueryBuilder) => {
          builder.select('name', 'email', 'displayName', 'avatar');
        },
      },
    ],
  };

  // Initialize our service with any options it requires
  app.use('/members', new Members(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('members');

  service.hooks(hooks);
}
