#!/bin/bash
TOP_DIR="$( cd -- "$(dirname "$0")/.." >/dev/null 2>&1 ; pwd -P )"
: ${BACKUP_DIR:=${TOP_DIR}/backup}

set -o pipefail
set -ueE
trap "echo ####################\nERROR!!!\n####################" ERR
source ${TOP_DIR}/setup/bash_funcs

check_setup_done () {
  if [[ $(volume_info postgres) = '' ]]; then
    die "Cannot backup because it is not yet set up."
  fi
  if [[ $(volume_info vault) = '' ]]; then
      die "Cannot backup because it is not yet set up."
  fi
}

prepare () {
  check_command
  search_docker_compose
  setup_dummy_gakunin_env_vars
  check_setup_done
}

get_project () {
  local service=$1
  echo $($DOCKER_COMPOSE ps --format json $service | jq -r .[].Project)
}

backup_volume () {
  local service=$1
  local volume=$2
  local target_dir=$3
  local dest=$4

  local container="$(get_project $service)-${service}-1"
  $DOCKER_COMPOSE pause $service
  docker run --rm --volumes-from ${container} -v ${dest}:/backup alpine \
    sh -c "tar -C ${target_dir} -czpf /backup/${volume}.tar.gz ."
  $DOCKER_COMPOSE unpause $service
}

backup_env () {
  local dest=$1
  cp -p $TOP_DIR/.env $dest
  cp -p $TOP_DIR/.env.sscfg $dest
}

backup () {
  mkdir -p ${BACKUP_DIR}
  local workdir=$(mktemp -d)
  trap "rm -rf $workdir" EXIT
  if ! is_external_vault; then
    backup_volume vault vault /vault/file $workdir
  else
    echo "No backup of the vault container will be performed since an external service is specified." >&2
  fi
	backup_volume postgres postgres /var/lib/postgresql/data $workdir
  backup_env $workdir

  local backup_file=${BACKUP_DIR}/backup-$(date +%Y%m%d%H%M%S).tar.gz 
  tar czpf $backup_file -C $workdir .
  echo "Backup is done: ${backup_file}"
}

cd $TOP_DIR;
prepare
backup
