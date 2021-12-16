// Initializes the `config-files` service on path `/config-files`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { ConfigFiles } from './config-files.class';
import hooks from './config-files.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'config-files': ConfigFiles & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
  };

  // Initialize our service with any options it requires
  app.use('/config-files', new ConfigFiles(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('config-files');

  service.hooks(hooks);
}
