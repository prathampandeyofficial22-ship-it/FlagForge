FROM node:22-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY packages/sdk/package.json ./packages/sdk/

# Install dependencies
RUN npm ci

# Copy source files
COPY server ./server
COPY packages/sdk ./packages/sdk

# Build SDK and Server
RUN npm run build:sdk
RUN npm run build:server

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY packages/sdk/package.json ./packages/sdk/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/sdk/dist ./packages/sdk/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/src/docs ./server/dist/docs

EXPOSE 4000

CMD ["node", "server/dist/index.js"]
