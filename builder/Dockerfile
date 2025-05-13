# Install dependencies
FROM node:22-alpine AS deps
COPY ./package.json ./package-lock.json /app/
COPY ./builder/package.json /app/builder/package.json
WORKDIR /app
RUN npm install-clean

# Create image
FROM fykosak/buildtools

# Install JS
RUN apt-get update && apt-get install -y nodejs npm

# Install modified texmf.cnf and update the main config
COPY ./builder/texmf.cnf /etc/texmf/texmf.d/50pm.cnf
RUN update-texmf

# Copy JS files
COPY --from=deps /app/node_modules /app/node_modules
COPY ./builder/tsconfig.json /app/builder/
COPY ./builder/src/ /app/builder/src

WORKDIR /app/builder
ENV NODE_ENV="production"
CMD ["npx", "tsx", "src/index.ts"]
