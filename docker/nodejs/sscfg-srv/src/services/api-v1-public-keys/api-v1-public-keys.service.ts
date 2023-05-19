// Initializes the `api-v1-public-keys` service on path `/api/v1/public-keys`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { ApiV1PublicKeys } from './api-v1-public-keys.class';
import hooks from './api-v1-public-keys.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'api/v1/public-keys': ApiV1PublicKeys & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
  };

  // Initialize our service with any options it requires
  app.use('/api/v1/public-keys', new ApiV1PublicKeys(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('api/v1/public-keys');

  service.hooks(hooks);
}
