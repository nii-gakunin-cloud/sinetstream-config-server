#!/bin/bash
: ${VERSION:=0.2.0}
: ${IMG_PREFIX:=harbor.vcloud.nii.ac.jp/sinetstream}
TOP_DIR="$( cd -- "$(dirname "$0")/.." >/dev/null 2>&1 ; pwd -P )"
source ${TOP_DIR}/setup/bash_funcs

set -o pipefail
set -ueE

setup_docker_compose () {
  search_docker_compose
  if [[ $DOCKER_COMPOSE = 'docker-compose' ]]; then
    export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1
  fi
}

build () {
  export IMG_TAG=${VERSION}-$(date "+%Y%m%d")
  local cfg=$TOP_DIR/docker/docker-compose-build.yml
  $DOCKER_COMPOSE -f $cfg build

  for img in sscfg-ui sscfg-srv sscfg-setup sscfg-shib-sp; do
    docker tag $IMG_PREFIX/$img:$IMG_TAG $IMG_PREFIX/$img:$VERSION
  done
}

setup_docker_compose
build
