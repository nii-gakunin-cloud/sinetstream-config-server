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

module.exports = async (on, config) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  require('@cypress/code-coverage/task')(on, config);
  const password = generatePassword();
  const env = process.env.VUE_APP_FEATHERS_URL != null
    ? { ...config.env, password, rest_url: process.env.VUE_APP_FEATHERS_URL }
    : { ...config.env, password };
  return {
    ...config,
    env,
    fixturesFolder: 'tests/e2e/fixtures',
    integrationFolder: 'tests/e2e/specs',
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    downloadsFolder: 'tests/e2e/downloads',
    supportFile: 'tests/e2e/support/index.ts',
  };
};
