#!/bin/sh
TOP_DIR="$( cd -- "$(dirname "$0")/.." >/dev/null 2>&1 ; pwd -P )"
set -o pipefail
set -ue

generate_git_info () {
  cat <<EOF > .env.local
VUE_APP_VERSION=${SSCFG_VERSION:-1.6.1-SNAPSHOT}
VUE_APP_GIT_COMMIT_HASH=$(git rev-parse --short HEAD)
EOF
}

update_package_version () {
  if [ -n "$SSCFG_VERSION" ]; then
    sed -i -e "/\"version\"[ ]*:/s/:[ ]*\"[^\"]*\"/: \"$SSCFG_VERSION\"/" package.json
  fi
}

cd $TOP_DIR/sscfg-ui

generate_git_info
update_package_version
