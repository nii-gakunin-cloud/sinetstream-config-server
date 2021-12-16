#!/bin/sh

: ${SSCFG_HOSTNAME:?"The host name of the configuration server is not set to SSCFG_HOSTNAME."}
: ${POSTGRES_DB:=sscfg}
: ${POSTGRES_USER:=sscfg}
: ${POSTGRES_PASSWORD:?"The password for the database connection is not set to POSTGRES_PASSWORD."}
: ${VAULT_ADDR:=http://vault:8200}
: ${VAULT_TOKEN:?"Vault token is not set to VAULT_TOKEN."}
: ${SSCFG_VAULT_PATH:=kv/sscfg}

misc/generate-config.js

if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ]; then
  set -- node "$@"
fi

exec "$@"

