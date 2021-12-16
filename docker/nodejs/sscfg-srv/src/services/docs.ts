import swagger, { SwaggerInitOptions } from 'feathers-swagger';
import { Application } from '../declarations';

interface UnknownObject {
  [propName: string]: any;
}

export const contentSchema = (schema: UnknownObject): UnknownObject => ({
  content: {
    'application/json': {
      schema,
    },
  },
});

export default function (app: Application): void {
  const securityParams = {
    components: {
      securitySchemes: {
        JwtAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'jwt',
        },
      },
    },
    security: [
      { JwtAuth: [] },
    ],
  };

  const docsParams: SwaggerInitOptions = {
    openApiVersion: 3,
    uiIndex: true,
    prefix: /api\/v\d\//,
    versionPrefix: /v\d/,
    include: {
      paths: ['api/v1/'],
    },
    specs: {
      info: {
        title: 'SINETStream Config Server API',
        description: 'SINETStreamライブラリに公開しているREST API',
        version: '1.0.0',
      },
      schemes: ['https'],
      ...securityParams,
    },
  };

  const { version } = app.get('git') ?? {};
  const internalDocsParams: SwaggerInitOptions = {
    openApiVersion: 3,
    docsPath: '/docs-internal',
    uiIndex: true,
    ignore: {
      paths: ['api/v1/'],
    },
    specs: {
      info: {
        title: 'SINETStream Config Server',
        description: 'コンフィグサーバのWebUIが内部で使用しているAPI',
        version,
      },
      schemes: ['https'],
      ...securityParams,
    },
  };

  app.configure(swagger(docsParams));
  if (process.env.NODE_ENV !== 'production') {
    app.configure(swagger(internalDocsParams));
  }
}
