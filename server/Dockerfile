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
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/server/node_modules /app/server/node_modules
COPY --from=latex /app/lang-latex /app/lang-latex
COPY ./server/tsconfig.json /app/server/
COPY ./server/src/ /app/server/src
WORKDIR /app/server

ENV NODE_ENV="production"
CMD ["npx", "tsx", "src/index.ts"]
