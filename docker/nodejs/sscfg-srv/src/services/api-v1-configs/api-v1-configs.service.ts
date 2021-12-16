// Initializes the `api-v1-configs` service on path `/api/v1/configs`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { ApiV1Configs } from './api-v1-configs.class';
import hooks from './api-v1-configs.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'api/v1/configs': ApiV1Configs & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/api/v1/configs', new ApiV1Configs(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('api/v1/configs');

  service.hooks(hooks);
}
