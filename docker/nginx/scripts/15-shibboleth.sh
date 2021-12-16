#!/bin/sh

switch_shibboleth_conf () {
  local template_dir="${NGINX_ENVSUBST_TEMPLATE_DIR:-/etc/nginx/templates}"     
  local suffix="${NGINX_ENVSUBST_TEMPLATE_SUFFIX:-.template}"

  if [ -n "$ENABLE_SHIBBOLETH" ]; then
    for fn in ${template_dir}/*.1; do
      mv $fn ${fn%.1}
    done
  else
    for fn in ${template_dir}/*.0; do
      mv $fn ${fn%.0}
    done
  fi
}

switch_shibboleth_conf

exit 0