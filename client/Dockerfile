FROM node:22-alpine AS latex
COPY ./package.json ./package-lock.json /app/
COPY ./lang-latex /app/lang-latex
WORKDIR /app/lang-latex
RUN npm install-clean

FROM node:22-alpine AS deps
COPY ./package.json ./package-lock.json /app/
COPY ./client/package.json /app/client/package.json
COPY ./server/package.json /app/server/package.json
COPY --from=latex /app/lang-latex /app/lang-latex
WORKDIR /app
RUN npm install-clean

FROM node:22-alpine AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/server/node_modules /app/server/node_modules
COPY --from=latex /app/lang-latex /app/lang-latex
COPY ./server /app/server
COPY ./client /app/client
WORKDIR /app/client
RUN npm run build

FROM nginx:stable
WORKDIR /app/client
COPY --from=latex /app/lang-latex /app/lang-latex
COPY --from=build /app/client/build/client .

# nginx config
COPY ./client/nginx.conf /etc/nginx/conf.d/default.conf

# env modification script
COPY ./client/docker-env.sh /docker-entrypoint.d/docker-env.sh
RUN chmod +x /docker-entrypoint.d/docker-env.sh
