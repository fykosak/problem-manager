FROM node:22-alpine AS latex
COPY ./package.json ./package-lock.json /app/
COPY ./lang-latex /app/lang-latex
WORKDIR /app/lang-latex
RUN npm install-clean

FROM node:22-alpine AS deps
COPY ./package.json ./package-lock.json /app/
COPY ./server/package.json /app/server/package.json
COPY --from=latex /app/lang-latex /app/lang-latex
WORKDIR /app
RUN npm install-clean

FROM node:22-alpine

RUN apk add cronie
RUN echo 'cd /app/server && npx tsx tools/importUsers.ts > /dev/null' > /etc/periodic/hourly/importUsers.sh
RUN chmod +x /etc/periodic/hourly/importUsers.sh

COPY ./server/entrypoint.sh /app/server/

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/server/node_modules /app/server/node_modules
COPY --from=latex /app/lang-latex /app/lang-latex
COPY ./server/tsconfig.json /app/server/
COPY ./server/src/ /app/server/src

ENV NODE_ENV="production"

WORKDIR /app/server
CMD ["./entrypoint.sh"]
