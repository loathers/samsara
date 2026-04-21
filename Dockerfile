# syntax=docker/dockerfile:1.5

############################
# 1) Build stage
############################
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN corepack enable

# Install deps first for better caching
COPY package.json yarn.lock ./
COPY .yarnrc.yml ./
COPY .yarn/ ./.yarn/

RUN yarn install --immutable

# Copy the rest of the source
COPY . .

RUN yarn build


############################
# 2) Runtime stage
############################
FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

ENV NODE_ENV=production

# Copy only what we need at runtime:
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn/ ./.yarn/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/kysely.config.ts ./kysely.config.ts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/app/db.ts ./app/db.ts
COPY --from=builder /app/app/utils.ts ./app/utils.ts

COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Run as non-root
USER node

ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["yarn", "start"]
