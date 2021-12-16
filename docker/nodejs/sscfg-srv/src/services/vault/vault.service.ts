// Initializes the `vault` service on path `/vault`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Vault } from './vault.class';
import hooks from './vault.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'vault': Vault & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
  };

  // Initialize our service with any options it requires
  app.use('/vault', new Vault(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('vault');

  service.hooks(hooks);
}
