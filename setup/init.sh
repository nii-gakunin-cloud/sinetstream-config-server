#!/bin/bash
TOP_DIR="$( cd -- "$(dirname "$0")/.." >/dev/null 2>&1 ; pwd -P )"
: ${CONF_YML:=${TOP_DIR}/docker-compose.yml}
: ${DOT_ENV:=${TOP_DIR}/.env.sscfg}

set -o pipefail
set -ueE
trap "echo ####################\nERROR!!!\n####################" ERR
source ${TOP_DIR}/setup/bash_funcs

generate_db_password () {
  local password=$(tr -cd _A-Z-a-z-0-9 < /dev/urandom | head -c${1:-16})
  if [[ ! -f ${DOT_ENV} ]]; then
    echo "POSTGRES_PASSWORD=$password" > $DOT_ENV
  elif ! grep -q -e '^POSTGRES_PASSWORD=' $DOT_ENV; then
    echo "POSTGRES_PASSWORD=$password" >> $DOT_ENV
  fi
}

migrate () {
  touch $DOT_ENV
  $DOCKER_COMPOSE -f ${CONF_YML} up -d setup_db
  $DOCKER_COMPOSE -f ${CONF_YML} exec setup_db /usr/local/bin/npx knex migrate:latest
}

setup_db () {
  generate_db_password
  trap "${DOCKER_COMPOSE} -f ${CONF_YML} --profile setup down > /dev/null 2>&1" EXIT
  migrate
}

setup_vault () {
  local vault_init=${TOP_DIR}/docker/nodejs/sscfg-srv/misc/vault-init.sh
  echo '########################################'
  env VAULT_ADDR=http://localhost:8200 DOT_ENV=$DOT_ENV $vault_init
  echo '########################################'
}

create_admin_user () {
  $DOCKER_COMPOSE -f ${CONF_YML} up -d setup_db
  $DOCKER_COMPOSE -f ${CONF_YML} exec setup_db misc/create-admin.sh
}

setup_dummy_vars () {
  export SSCFG_HOSTNAME=localhost
  export CERT_FILE=$TOP_DIR/README.md
  export KEY_FILE=$TOP_DIR/README.md
  setup_dummy_gakunin_env_vars
}

check_prerequisite () {
  check_command
  search_docker_compose
  check_volumes
  setup_dummy_vars
}

setup () {
  check_prerequisite
  setup_db
  setup_vault
  create_admin_user
}

setup
echo 'Config server setup succeeded.'
