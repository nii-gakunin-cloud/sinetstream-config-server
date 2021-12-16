// Initializes the `info` service on path `/info`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Info } from './info.class';
import hooks from './info.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'info': Info & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
  };

  // Initialize our service with any options it requires
  app.use('/info', new Info(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('info');

  service.hooks(hooks);
}
