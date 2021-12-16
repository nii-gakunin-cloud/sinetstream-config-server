// Initializes the `stream-names` service on path `/stream-names`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { StreamNames } from './stream-names.class';
import hooks from './stream-names.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'stream-names': StreamNames & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/stream-names', new StreamNames(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('stream-names');

  service.hooks(hooks);
}
