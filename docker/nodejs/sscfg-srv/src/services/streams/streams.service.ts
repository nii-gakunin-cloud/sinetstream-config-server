// Initializes the `streams` service on path `/streams`
import { ServiceAddons } from '@feathersjs/feathers';
import { QueryBuilder } from 'knex';
import { Application } from '../../declarations';
import createModel from '../../models/streams.model';
import { Streams } from './streams.class';
import hooks from './streams.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'streams': Streams & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    whitelist: ['$eager', '$joinEager'],
    allowEager: '[members, members.user, topics]',
    allowedInsert: 'topics',
    allowedUpsert: 'topics',
    eagerFilters: [
      {
        expression: 'members.user',
        filter: (builder: QueryBuilder) => {
          builder.select('name', 'email', 'displayName');
        },
      },
      {
        expression: 'members',
        filter: (builder: QueryBuilder) => {
          builder.select('admin', 'user_id');
        },
      },
    ],
  };

  // Initialize our service with any options it requires
  app.use('/streams', new Streams(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('streams');

  service.hooks(hooks);
}
