import {defineConfig} from 'cypress';

function generatePassword(length = 16) {
  let ret = '';
  const letters = [...Array(10)].map((x, i) => String.fromCharCode(i + 48)).concat(
    [...Array(26)].map((x, i) => String.fromCharCode(i + 65)),
    [...Array(26)].map((x, i) => String.fromCharCode(i + 97)),
  );
  for (let i = 0; i < length; i += 1) {
    ret += letters[Math.floor(Math.random() * letters.length)];
  }
  return ret;
}

const password = generatePassword();
const env = process.env.VUE_APP_FEATHERS_URL != null
  ? {
      password,
      rest_url: process.env.VUE_APP_FEATHERS_URL,
    }
  : { password };

export default defineConfig({
  e2e: {
    specPattern: 'tests/e2e/specs/*.ts',
    supportFile: 'tests/e2e/support/index.ts',
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config
    },
  },
  downloadsFolder: 'tests/e2e/downloads',
  fixturesFolder: 'tests/e2e/fixtures',
  screenshotsFolder: 'tests/e2e/screenshots',
  videosFolder: 'tests/e2e/videos',
  "video": false,
  "env": {
    "admin": "admin",
    "admin_password": "",
    "username": "test-user",
    "email": "test@example.org",
    "display_name": "test user",
    "codeCoverageTasksRegistered": true,
    ...env,
  },
  "retries": {
    "runMode": 2,
    "openMode": 0
  },
  "reporter": "cypress-multi-reporters",
  "reporterOptions": {
    "configFile": "reporter-config.json"
  }
});