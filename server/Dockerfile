ARG NODE_VERSION="24"

FROM node:${NODE_VERSION} AS latex
COPY ./package.json ./package-lock.json /app/
COPY ./lang-latex /app/lang-latex
WORKDIR /app/lang-latex
RUN npm install-clean

FROM node:${NODE_VERSION} AS deps
COPY ./package.json ./package-lock.json /app/
COPY ./server/package.json /app/server/package.json
COPY --from=latex /app/lang-latex /app/lang-latex
WORKDIR /app
RUN npm install-clean

FROM node:${NODE_VERSION}

RUN apt-get update && apt-get install -y cron
RUN echo "#!/bin/sh\ncd /app/server && npx tsx tools/importUsers.ts > /dev/null" > /etc/cron.hourly/importUsers
RUN chmod +x /etc/cron.hourly/importUsers

COPY ./server/entrypoint.sh /app/server/

COPY --from=deps /app/ /app/
COPY --from=latex /app/lang-latex /app/lang-latex
COPY ./server/tsconfig.json /app/server/
COPY ./server/tools/ /app/server/tools
COPY ./server/src/ /app/server/src

ENV NODE_ENV="production"

WORKDIR /app/server
CMD ["./entrypoint.sh"]
