FROM node:22-alpine AS deps
COPY ./package.json ./package-lock.json /app/
COPY ./builder/package.json /app/builder/package.json
WORKDIR /app
RUN npm install-clean


FROM fykosak/buildtools
COPY --from=deps /app/node_modules /app/node_modules
COPY ./builder/tsconfig.json /app/builder/
COPY ./builder/src/ /app/builder/src

RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app/builder
ENV NODE_ENV="production"
CMD ["npx", "tsx", "src/index.ts"]
