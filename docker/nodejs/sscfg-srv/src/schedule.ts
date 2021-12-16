import { GeneralError } from '@feathersjs/errors';
import schedule from 'node-schedule';
import { Application } from './declarations';
import logger from './logger';

const cleanupAccessKeys = (app: Application) => (fireDate: Date) => {
  const { token: vaultToken } = app.get('hashicorpVault');
  const service = app.service('access-keys');
  const now = fireDate.toISOString();
  logger.info('Perform access key clean-up.');
  (async () => {
    try {
      const expired = (await service.find({
        query: {
          $all: true,
          $joinEager: 'expiration',
          'expiration.expirationTime': { $lt: now },
        },
        paginate: false,
        vaultToken,
      })) as Record<string, any>[];
      await Promise.all(expired.map(async (x) => service.remove(x.id, { vaultToken })));
    } catch (e: any) {
      logger.error(e.toString());
    }
  })();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cleanupCubbyhole = (app: Application) => (fireDate: Date) => {
  const { vaultPath: rootPath } = app.get('authentication')?.shibboleth ?? {};
  logger.info('Perform cubbyhole clean-up.');
  (async () => {
    try {
      const service = app.service('sys-vault');
      const tokens = await service.find({ path: rootPath });
      if (!(tokens instanceof Array)) {
        throw new GeneralError();
      }
      const expired = await Promise.all(tokens.map((x) => (x.slice(0, -1)))
        .filter(async (token) => {
          try {
            const path = 'sys/wrapping/lookup';
            await service.create({ path, token });
            return false;
          } catch (e) {
            return true;
          }
        }));
      await Promise.all(expired.map(async (token) => {
        logger.verbose(`cleanup wrapping token: ${token}`);
        return service.remove(`${rootPath}/${token}`);
      }));
    } catch (e: any) {
      const { code } = e;
      if (code === 404) {
        logger.verbose(e.toString());
      } else {
        logger.error(e.toString());
      }
    }
  })();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const renewVaultToken = (app: Application) => (fireDate: Date) => {
  logger.info('Perform renew vault token.');
  (async () => {
    try {
      const service = app.service('sys-vault');
      const path = 'auth/token/renew-self';
      const query = { $select: 'all' };
      await service.create({ path }, { query });
    } catch (e: any) {
      logger.error(e.toString());
    }
  })();
};

export default function (app: Application): void {
  logger.debug('Register a scheduled job.');
  if (process.env.NODE_ENV !== 'test') {
    const cfg = app.get('schedule');
    schedule.scheduleJob(cfg.cleanupAccessKeys, cleanupAccessKeys(app));
    schedule.scheduleJob(cfg.cleanupCubbyhole, cleanupCubbyhole(app));
    schedule.scheduleJob(cfg.renewVaultToken, renewVaultToken(app));
  }
}
