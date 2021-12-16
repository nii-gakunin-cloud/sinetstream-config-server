#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const crypto = require('crypto');

function loadConfigFile(path = 'config/production.json') {
  try {
    fs.accessSync(path);
    const txt = fs.readFileSync(path);
    return JSON.parse(txt);
  } catch (e) {
    return {};
  }
}

function saveConfigFile(data, path = 'config/production.json') {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function paramValue(name, envName, curValue, defaultValue, toValue) {
  if (process.env[envName] != null) {
    return {
      [name]: toValue == null
        ? process.env[envName] : toValue(process.env[envName]),
    };
  }
  if (curValue != null) {
    return { [name]: curValue };
  }
  if (defaultValue == null) {
    throw new Error(`${envName} must be specified.`);
  }
  return { [name]: defaultValue };
}

function isEnableShibboleth() {
  const { ENABLE_SHIBBOLETH: v } = process.env;
  if (v == null) {
    return false;
  }
  switch (v.toLocaleLowerCase().trim()) {
    case 'true':
    case 'yes':
    case '1':
      return true;
    case 'false':
    case 'no':
    case '0':
    default:
      return false;
  }
}

function updateAuthentication(data) {
  const secret = data?.secret != null
    ? data.secret : crypto.randomBytes(20).toString('base64');
  const jwtOptions = {
    ...paramValue(
      'audience', 'SSCFG_HOSTNAME', data?.jwtOptions?.audidence, null,
      (v) => (`https://${v}`),
    ),
    ...paramValue(
      'issuer', 'SSCFG_HOSTNAME', data?.jwtOptions?.issuer,
    ),
  };
  const authStrategies = isEnableShibboleth()
    ? {
      authStrategies: [
        'jwt',
        'local',
        'api-access',
        'shibboleth',
      ],
    }
    : {};
  return { secret, jwtOptions, ...authStrategies };
}

function updateVault(data) {
  return {
    ...paramValue('addr', 'VAULT_ADDR', data?.addr, 'http://vault:8200/'),
    ...paramValue('token', 'VAULT_TOKEN', data?.token),
    ...paramValue(
      'rootPath', 'SSCFG_VAULT_PATH', data?.rootPath, 'kv/sscfg/',
      (v) => (v.endsWith('/') ? v : `${v}/`),
    ),
  };
}

function updateRedis(data) {
  return {
    ...paramValue('host', 'REDIS_HOST', data?.host, 'redis'),
  };
}

function updatePostgres(data) {
  const {
    POSTGRES_USER, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT,
  } = process.env;
  const user = POSTGRES_USER != null ? POSTGRES_USER : 'sscfg';
  const db = POSTGRES_DB != null ? POSTGRES_DB : 'sscfg';
  const host = POSTGRES_HOST != null ? POSTGRES_HOST : 'postgres';
  const port = POSTGRES_PORT != null ? POSTGRES_PORT : '5432';
  return {
    ...paramValue(
      'connection', 'POSTGRES_PASSWORD', data?.connection, null,
      (x) => (`postgres://${user}:${x}@${host}:${port}/${db}`),
    ),
  };
}

function updateConfig(data) {
  const authentication = updateAuthentication(data.authentication);
  const postgres = updatePostgres(data.postgres);
  const redisParams = updateRedis(data.redisParams);
  const hashicorpVault = updateVault(data.hashicorpVault);
  return {
    ...paramValue('host', 'SSCFG_HOSTNAME'),
    authentication,
    postgres,
    redisParams,
    hashicorpVault,
  };
}

function setup() {
  let data = loadConfigFile();
  data = updateConfig(data);
  saveConfigFile(data);
}

setup();
