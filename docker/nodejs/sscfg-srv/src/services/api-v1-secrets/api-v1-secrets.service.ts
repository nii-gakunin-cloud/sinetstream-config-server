// Initializes the `api-v1-secrets` service on path `/api/v1/secrets`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { ApiV1Secrets } from './api-v1-secrets.class';
import hooks from './api-v1-secrets.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'api/v1/secrets': ApiV1Secrets & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/api/v1/secrets', new ApiV1Secrets(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('api/v1/secrets');

  service.hooks(hooks);
}
