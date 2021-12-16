import app from '../src/app';

afterAll(async () => {
  const redis = app.get('redis');
  if (redis != null) {
    redis.disconnect();
  }
  return app.get('knex').destroy();
});
