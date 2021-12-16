// Initializes the `access-key-expirations` service on path `/access-key-expirations`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { AccessKeyExpirations } from './access-key-expirations.class';
import createModel from '../../models/access-key-expirations.model';
import hooks from './access-key-expirations.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'access-key-expirations': AccessKeyExpirations & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
  };

  // Initialize our service with any options it requires
  app.use('/access-key-expirations', new AccessKeyExpirations(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('access-key-expirations');

  service.hooks(hooks);
}
