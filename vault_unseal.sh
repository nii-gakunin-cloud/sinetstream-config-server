#!/bin/bash
: ${VAULT_ADDR:=http://localhost:8200}
TOP_DIR="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
source ${TOP_DIR}/setup/bash_funcs
set -o pipefail
set -ueE
trap "echo ####################\nERROR!!!\n####################" ERR

vault_unseal () {
  if ! vault_status; then
    $DOCKER_COMPOSE exec -e VAULT_ADDR=$VAULT_ADDR vault vault operator unseal $*
  else
    echo "INFO: Already unsealed." >&2
  fi
}

check_prerequisite () {
  check_command
  search_docker_compose
  setup_dummy_gakunin_env_vars
  if [[ -z "$(container_id vault)" ]]; then
    die "The Vault container is not running."
  fi
}

cd $TOP_DIR
check_prerequisite
vault_unseal "$@"
