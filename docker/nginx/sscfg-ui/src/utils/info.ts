import { ref, Ref } from '@vue/composition-api';
import feathersClient from '@/feathers-client';

interface VersionInfo {
  version: Ref<Record<string, string>>;
}

interface HealthInfo {
  health: Ref<boolean>;
}

interface ShibbolethConf {
  shibbolethPath: Ref<string | null>;
}

const useVersion = (): VersionInfo => {
  const version: Ref<Record<string, string>> = ref({});
  const service = feathersClient.service('info');
  (async () => {
    const res = await service.get('version');
    Object.assign(
      version.value,
      Object.fromEntries(Object.entries(res).map(
        ([key, value]) => ([`server ${key}`, String(value)]),
      )),
    );
  })();

  if (process.env.VUE_APP_VERSION) {
    version.value['client version'] = process.env.VUE_APP_VERSION;
  }
  if (process.env.VUE_APP_GIT_COMMIT_HASH) {
    version.value['client commit'] = process.env.VUE_APP_GIT_COMMIT_HASH;
  }

  return { version };
};

const useHealth = (): HealthInfo => {
  const service = feathersClient.service('info');
  const health = ref(true);
  (async () => {
    try {
      await service.get('health');
      health.value = true;
    } catch (e) {
      health.value = false;
    }
  })();
  return { health };
};

const useShibboleth = (): ShibbolethConf => {
  const service = feathersClient.service('info');
  const shibbolethPath: Ref<string | null> = ref(null);
  (async () => {
    try {
      const { shibboleth } = await service.get('config');
      if (shibboleth.enabled) {
        shibbolethPath.value = shibboleth.url;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {
    }
  })();
  return { shibbolethPath };
};

export {
  VersionInfo,
  HealthInfo,
  ShibbolethConf,
  useVersion,
  useHealth,
  useShibboleth,
};
