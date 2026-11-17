# Stage 1: Build & Dependencies
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copy root configuration and manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json turbo.json ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Install pnpm and dependencies
RUN apk add --no-cache curl bash nodejs npm && \
    npm install -g pnpm@11.5.2 && \
    pnpm install --frozen-lockfile

# Run build across packages
RUN pnpm exec turbo run build

# Stage 2: Production Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app /app

EXPOSE 3000

CMD ["bun", "apps/server/src/index.ts"]
