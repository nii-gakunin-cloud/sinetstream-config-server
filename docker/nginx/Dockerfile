FROM node:16.20 as build

WORKDIR /home/node/app
COPY ./sscfg-ui/package*.json ./
RUN npm install

COPY ./sscfg-ui ./
RUN npm run build

# -----------------------------------------------------------------
FROM jekyll/jekyll:4.2.2 as docs
COPY ./sscfg-manual /srv/jekyll
RUN jekyll build

# -----------------------------------------------------------------
FROM nginx:1.24

COPY --from=build /home/node/app/dist /var/www/html/
COPY --from=docs /srv/jekyll/_site /var/www/manual/
COPY templates /etc/nginx/templates/
COPY scripts /docker-entrypoint.d
