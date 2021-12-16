FROM centos:7.9.2009

RUN yum -y update \
 && yum -y install httpd mod_ssl \
 && yum clean all

# hadolint ignore=DL3059
RUN curl 'https://shibboleth.net/cgi-bin/sp_repo.cgi?platform=CentOS_7' \
  -o /etc/yum.repos.d/shibboleth.repo \
 && yum -y install shibboleth \
 && yum clean all \
 && chmod a+x /etc/shibboleth/shibd-redhat

# hadolint ignore=DL3059
RUN yum -y install epel-release \
 && yum -y install supervisor \
 && yum clean all \
 && yum-config-manager --disable epel

ARG PHP_VERSION=php80
RUN yum -y install https://rpms.remirepo.net/enterprise/remi-release-7.rpm \
 && yum install -y --enablerepo=remi-${PHP_VERSION} \
      php php-pdo php-pgsql php-xml which \
 && yum clean all

EXPOSE 443
CMD ["/usr/local/bin/init"]

COPY supervisord.conf /etc/supervisord.d/shibboleth.ini
COPY php /var/www/html/shibboleth
COPY scripts /usr/local/bin

RUN curl 'https://meatwiki.nii.ac.jp/confluence/download/attachments/12158175/attribute-map-template.xml?version=7&modificationDate=1563426445000&api=v2&download=true' \
      -L -o /etc/shibboleth/attribute-map.xml \
 && curl 'https://meatwiki.nii.ac.jp/confluence/download/attachments/12158175/attribute-policy-template.xml?version=4&modificationDate=1563426433000&api=v2&download=true' \
      -L -o /etc/shibboleth/policy-map.xml
