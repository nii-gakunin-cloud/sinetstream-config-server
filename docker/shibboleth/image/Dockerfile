FROM rockylinux:9.1

RUN dnf -y install httpd mod_ssl which \
 && dnf clean all

RUN curl 'https://shibboleth.net/cgi-bin/sp_repo.cgi?platform=rockylinux9' \
  -o /etc/yum.repos.d/shibboleth.repo \
 && dnf -y install shibboleth \
 && dnf clean all \
 && chmod a+x /etc/shibboleth/shibd-redhat

RUN dnf -y install epel-release 'dnf-command(config-manager)' \
 && dnf config-manager --set-enabled crb \
 && dnf -y install supervisor \
 && dnf clean all \
 && dnf -y install https://rpms.remirepo.net/enterprise/remi-release-9.rpm \
 && dnf config-manager --set-enabled remi

ARG PHP_VERSION=8.0
RUN dnf -y module reset php \
 && dnf -y module install php:remi-${PHP_VERSION} \
 && dnf -y install php-pdo php-pgsql \
 && dnf clean all \
 && mkdir -p /var/run/php-fpm

EXPOSE 443
CMD ["/usr/local/bin/init"]

COPY etc /etc
COPY php /var/www/html/shibboleth
COPY scripts /usr/local/bin

RUN curl 'https://meatwiki.nii.ac.jp/confluence/download/attachments/12158175/attribute-map-template.xml?version=7&modificationDate=1563426445000&api=v2&download=true' \
      -L -o /etc/shibboleth/attribute-map.xml \
 && curl 'https://meatwiki.nii.ac.jp/confluence/download/attachments/12158175/attribute-policy-template.xml?version=4&modificationDate=1563426433000&api=v2&download=true' \
      -L -o /etc/shibboleth/policy-map.xml
