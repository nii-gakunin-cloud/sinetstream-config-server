// Initializes the `attach-files` service on path `/attach-files`
import { ServiceAddons } from '@feathersjs/feathers';
import { Knex } from 'knex';
import { Application } from '../../declarations';
import createModel from '../../models/attach-files.model';
import { AttachFiles } from './attach-files.class';
import hooks from './attach-files.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'attach-files': AttachFiles & ServiceAddons<any>;
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
  };

  // Initialize our service with any options it requires
  app.use('/attach-files', new AttachFiles(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('attach-files');

  service.hooks(hooks);
}
