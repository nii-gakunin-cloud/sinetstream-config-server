#!/bin/bash
TOP_DIR="$( cd -- "$(dirname "$0")/.." >/dev/null 2>&1 ; pwd -P )"

set -o pipefail
set -ueE
trap "echo ####################\nERROR!!!\n####################" ERR
source ${TOP_DIR}/setup/bash_funcs

exist_backup_file () {
  if [[ ! -f "$backup_file" ]]; then
    die "file not found: ${backup_file}"
  fi
}

check_prerequisite () {
  check_command
  search_docker_compose
  setup_dummy_gakunin_env_vars
  check_volumes
  exist_backup_file
}

restore_volume () {
  local backup_file=$1
  local volume=$2
  docker run --rm -v ${volume}:/data -v ${backup_file}:/backup.tar.gz alpine \
    sh -c "tar -C /data -xzpf /backup.tar.gz ."
}

restore_env_file () {
  local src_dir=$1
  local file_name=$2
  local dest_file=$TOP_DIR/$file_name
  if [[ -f $dest_file ]]; then
    mv $dest_file ${dest_file}.$(date +%Y%m%d%H%M%S)~
  fi
  cp -p $src_dir/$file_name $dest_file
}

restore_env () {
  local src_dir=$1
  restore_env_file $src_dir .env
  restore_env_file $src_dir .env.sscfg
}

restore () {
  local workdir=$(mktemp -d)
  trap "rm -rf $workdir" EXIT
  tar xzpf $backup_file -C $workdir
  if ! is_external_vault; then
    restore_volume $workdir/vault.tar.gz vault
  fi
  restore_volume $workdir/postgres.tar.gz postgres
  restore_env $workdir
  echo "Recovery is now complete."
}

usage () {
  echo "Usage: $(basename $0) -f backup_file" >&2
}

parse_opt () {
  local opt
  while getopts f: opt; do
    case "$opt" in
    f)
      backup_file="$OPTARG"
      ;;
    \?)
      usage
      exit 1
      ;;
    esac
  done
  set +u
  if [[ -z "$backup_file" ]]; then
    usage
    exit 1
  fi
  set -u
}

cd $TOP_DIR;
parse_opt "$@"
check_prerequisite
restore