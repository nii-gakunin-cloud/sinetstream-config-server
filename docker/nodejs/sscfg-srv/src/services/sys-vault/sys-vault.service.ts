// Initializes the `sys-vault` service on path `/sys-vault`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { SysVault } from './sys-vault.class';
import hooks from './sys-vault.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'sys-vault': SysVault & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/sys-vault', new SysVault(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('sys-vault');

  service.hooks(hooks);
}
