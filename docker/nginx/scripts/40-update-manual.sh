#!/bin/sh

: ${NGINX_HOST:?"The host name of the configuration server is not set to NGINX_HOST."}

find /var/www/manual -name '*.html' -print0 | \
  xargs -0 sed -i -e "/sscfg.example.org/s#sscfg.example.org#${NGINX_HOST}#g"
