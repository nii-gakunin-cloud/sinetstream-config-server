#!/bin/sh
TOP_DIR="$( cd -- "$(dirname "$0")/.." >/dev/null 2>&1 ; pwd -P )"
: ${SSCFG_VERSION:=1.6.0}
set -o pipefail
set -ue

generate_git_info () {
  cat <<EOF > config/local.json
{
  "git": {
    "version": "$SSCFG_VERSION",
    "commit": "$(git rev-parse --short HEAD)"
  }
}
EOF
}

update_package_version () {
  if [ -n "$SSCFG_VERSION" ]; then
    sed -i -e "/\"version\"[ ]*:/s/:[ ]*\"[^\"]*\"/: \"$SSCFG_VERSION\"/" package.json
  fi
}

cd $TOP_DIR/sscfg-srv

generate_git_info
update_package_version
