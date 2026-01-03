# syntax=docker/dockerfile:1.5

############################
# 1) Build stage
############################
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Prisma + many native deps expect openssl present
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Enable yarn via corepack (supports yarn classic + berry)
RUN corepack enable

# Install deps first for better caching
COPY package.json yarn.lock ./
# If you're on Yarn Berry, you may also have these:
COPY .yarnrc.yml ./
COPY .yarn/ ./.yarn/

# Install dependencies (include dev deps for build)
RUN yarn install --immutable || yarn install --frozen-lockfile

# Copy the rest of the source
COPY . .

# If you use Prisma, generating client at build-time is typical
# (Safe even if you also generate elsewhere)
RUN yarn prisma generate

# Build (e.g., Vite/Next/etc.)
RUN yarn build


############################
# 2) Runtime stage
############################
FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
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
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/app/utils.ts ./app/utils.ts


# Add an entrypoint to run migrations then start
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as non-root
USER node

# Your app should listen on $PORT or 3000 depending on your setup
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["yarn", "start"]
