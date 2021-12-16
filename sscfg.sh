#!/bin/bash
TOP_DIR="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
: ${DOT_ENV:=${TOP_DIR}/.env}

set -o pipefail
set -ueE
trap "echo ####################\nERROR!!!\n####################" ERR
source ${TOP_DIR}/setup/bash_funcs

check_env_vars () {
  if [[ -z "$SSCFG_HOSTNAME" ]]; then
    die "The host name of the configuration server is not set to SSCFG_HOSTNAME."
  fi
  if [[ -z "$CERT_FILE" ]]; then
    die "The path to the server certificate file is not set to CERT_FILE."
  fi
  if [[ -z "$KEY_FILE" ]]; then
    die "The path to the private key file for the server certificate is not set to KEY_FILE."
  fi
}

check_gakunin_env_vars () {
  if [[ -z "$GAKUNIN_SIGNER" ]]; then
    die "The path to the certificate file for signature verification is not set to GAKUNIN_SIGNER."
  fi
  if [[ ! -f $GAKUNIN_SIGNER ]]; then
    die "The certificate file for signature verification specified in GAKUNIN_SIGNER does not exist."
  fi

  if [[ -z "$GAKUNIN_SAMLDS" ]]; then
    die "The address of the discovery service is not set to GAKUNIN_SAMLDS."
  fi
  if ! curl -sfI $GAKUNIN_SAMLDS > /dev/null 2>&1; then
    die "Unable to access the address of the discovery service configured for GAKUNIN_SAMLDS."
  fi

  if [[ -z "$GAKUNIN_METADATA" ]]; then
    die "The address of the metadata is not set to GAKUNIN_METADATA."
  fi
  if ! curl -sfI $GAKUNIN_METADATA > /dev/null 2>&1; then
    die "Unable to access the metadata address set for GAKUNIN_METADATA."
  fi

  if [[ -z "$SP_CERT_FILE" ]]; then
    die "The path to the SP certificate file is not set to SP_CERT_FILE."
  fi
  if [[ ! -f "$SP_CERT_FILE" ]]; then
    die "The SP certificate file does not exist.: $SP_CERT_FILE"
  fi

  if [[ -z "$SP_KEY_FILE" ]]; then
    die "The path to the private key file for the SP certificate is not set to SP_KEY_FILE."
  fi
  if [[ ! -f "$SP_CERT_FILE" ]]; then
    die "The private key for the SP certificate does not exist.: $SP_KEY_FILE"
  fi
}

check_certs () {
  if [[ ! -f $CERT_FILE ]]; then
    die "The certificate file does not exist.: $CERT_FILE"
  fi
  if [[ ! -f $KEY_FILE ]]; then
    die "The private key for the certificate does not exist.: $KEY_FILE"
  fi
}

check_setup_done () {
  if [[ ! -f $TOP_DIR/.env.sscfg ]]; then
    die "Cannot start because it is not yet set up."
  fi
  if [[ $(volume_info postgres) = '' ]]; then
    die "Cannot start because it is not yet set up."
  fi
  if [[ $(volume_info vault) = '' ]]; then
    die "Cannot start because it is not yet set up."
  fi
}

check_prerequisite () {
  check_command
  set +u
  if is_enabled_shibboleth; then
    check_gakunin_env_vars
  fi
  check_env_vars
  set -u
  setup_dummy_gakunin_env_vars
  check_certs
  search_docker_compose
  check_setup_done
}

setup () {
  load_env_file $DOT_ENV
  check_prerequisite
}

op_containers () {
  local cmd=$1
  local cfg_yml=${TOP_DIR}/docker-compose.yml
  set +u
  if is_enabled_shibboleth; then
    local profile="--profile shibboleth"
  else
    local profile="--profile sscfg"
  fi
  set -u
  if ! is_external_vault; then
    profile="$profile --profile vault"
  fi

  $DOCKER_COMPOSE $profile -f $cfg_yml $cmd
}

restart_containers () {
  local cfg_yml=${TOP_DIR}/docker-compose.yml
  $DOCKER_COMPOSE -f $cfg_yml restart $target_service
}

check_vault_status () {
  if ! is_external_vault && ! vault_status; then
    echo "=============================" >&2
    echo "You need to unseal the Vault." >&2
    echo "=============================" >&2
  fi
}

start () {
  setup
  op_containers "up -d --remove-orphans"
  check_vault_status
}

stop () {
  setup
  op_containers stop
}

down () {
  setup
  op_containers "down --remove-orphans"
}

status () {
  setup
  op_containers ps
}

restart () {
  setup
  if [[ -n "$target_service" ]]; then
    restart_containers
  else
    op_containers restart
  fi
}

usage () {
  echo "usage: $(basename $0) -s | -t | -d | -r [ service ] | [ -S ]" >&2
  echo "    -s | --start     Start config server." >&2
  echo "    -t | --stop      Stop the container of the config server." >&2
  echo "    -d | --down      Stop and delete the container" >&2
  echo "    -r | --restart   Restart the container." >&2
  echo "    -S | --status    Display the container status. (default)" >&2
}

parse_opts () {
  local opt
  op="status"
  while getopts stdrSh-: opt; do
    [[ "$opt" = - ]] && opt="-$OPTARG"
    case "-$opt" in
      -s|--start)
        op=start
        ;;
      -t|--stop)
        op=stop
        ;;
      -r|--restart)
        op=restart
        target_service="${!OPTIND}"
        ;;
      -d|--down)
        op=down
        ;;
      -S|--status)
        op=status
        ;;
      -h|--help)
        usage
        exit 1
        ;;
      -\?)
        usage
        exit 1
        ;;
      --*)
        echo "$0: illegal option -- ${opt##-}" >&2
        usage
        exit 1
        ;;
    esac
  done
}

cd $TOP_DIR;
parse_opts "$@"
case $op in
  start)
    start
    ;;
  stop)
    stop
    ;;
  down)
    down
    ;;
  status)
    status
    ;;
  restart)
    restart
    ;;
esac