ARG NODE_VERSION=16.20
FROM node:${NODE_VERSION} as build
WORKDIR /home/node/app
COPY sscfg-srv/package*.json ./
RUN npm install
COPY sscfg-srv ./
ENV NODE_ENV production
RUN npm run compile

FROM node:${NODE_VERSION}-slim
WORKDIR /home/node/app
ENV NODE_ENV production
COPY sscfg-srv/package*.json ./
RUN npm install
COPY --from=build /home/node/app/lib lib/
COPY sscfg-srv/config config/
COPY sscfg-srv/public public/
COPY sscfg-srv/misc misc
COPY scripts /usr/local/bin
CMD ["node", "lib"]
