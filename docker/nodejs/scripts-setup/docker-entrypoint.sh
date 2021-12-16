#!/bin/sh

: ${POSTGRES_DB:=sscfg}
: ${POSTGRES_USER:=sscfg}
: ${POSTGRES_PASSWORD:?"The password for the database connection is not set to POSTGRES_PASSWORD."}
: ${WAIT_FOR:="postgres:5432"}

env SSCFG_HOSTNAME=localhost VAULT_TOKEN=token misc/generate-config.js

set -- /usr/local/bin/wait-for-it.sh --timeout=${WAIT_FOR_TIMEOUT:-150} ${WAIT_FOR} -- "$@"

exec "$@"

