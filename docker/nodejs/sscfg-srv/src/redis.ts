import Redis from 'ioredis';
import { Application } from './declarations';

export default function (app: Application): void {
  const redis = new Redis(app.get('redisParams'));
  app.set('redis', redis);
}
