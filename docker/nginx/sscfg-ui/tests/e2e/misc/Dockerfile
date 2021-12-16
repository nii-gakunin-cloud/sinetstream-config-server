ARG DOCKER_VERSION=20.10.11
FROM docker:${DOCKER_VERSION}-dind

RUN apk add --no-cache supervisor \
 && mkdir -p /etc/supervisor.d

COPY sscfg.ini /etc/supervisor.d

ARG COMPOSE_V2_VERSION=2.1.1
ARG COMPOSE_URL=https://github.com/docker/compose/releases/download/v${COMPOSE_V2_VERSION}/docker-compose-linux-x86_64
RUN apk add --no-cache curl \
 && mkdir -p /usr/local/libexec/docker/cli-plugins \
 && curl -L -o /usr/local/libexec/docker/cli-plugins/docker-compose $COMPOSE_URL \
 && chmod a+x /usr/local/libexec/docker/cli-plugins/docker-compose

COPY sscfg /srv

WORKDIR /srv

EXPOSE 3030

CMD ["/usr/bin/supervisord", "-n"]
