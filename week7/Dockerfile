# Multi-Stage Hardened Dockerfile for CyberShield (Next.js 16 + Prisma)
# Follows CIS Container Hardening & Least Privilege Principles

# ------------------------------------------------------------------------------
# Stage 1: Build Dependencies (All dependencies including devDependencies)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install all dependencies based on package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Production Dependencies (Excludes devDependencies for lightweight runner)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS prod-deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ------------------------------------------------------------------------------
# Stage 3: Application Builder
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy DATABASE_URL solely for build-time Prisma generate validation
ENV DATABASE_URL="postgresql://build-dummy:build-dummy@localhost:5432/build_dummy?schema=public"
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=true
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Dedicated Database Migration Runner (One-off execution via Compose)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS migrator
RUN apk add --no-cache libc6-compat openssl dumb-init
WORKDIR /app

ENV NODE_ENV=production

# Security: Create dedicated non-root system group & user (UID/GID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy dependencies with Prisma CLI and migration files with non-root ownership
COPY --chown=nextjs:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs prisma ./prisma
COPY --chown=nextjs:nodejs prisma.config.ts package.json ./

USER nextjs

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npx", "prisma", "migrate", "deploy"]

# ------------------------------------------------------------------------------
# Stage 5: Hardened Non-Root Production Runner
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install only essential runtime libraries (openssl & libc6-compat for Prisma, dumb-init for PID 1 signal handling)
RUN apk add --no-cache openssl libc6-compat dumb-init

# Security: Create dedicated non-root system group & user (UID/GID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production-only node_modules (excludes devDependencies like Vitest, Playwright, ESLint)
COPY --chown=nextjs:nodejs --from=prod-deps /app/node_modules ./node_modules

# Copy generated Prisma Client artifacts from builder
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built application and runtime assets with restricted non-root ownership
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs --from=builder /app/.next ./.next
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/prisma.config.ts ./prisma.config.ts

# Prepare cache directory with non-root ownership
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next/cache

# Switch to non-root user (Enforces Least Privilege)
USER nextjs

EXPOSE 3000

# Healthcheck for container orchestration: uses lightweight /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# dumb-init handles PID 1 signals cleanly (graceful shutdown)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "run", "start"]
