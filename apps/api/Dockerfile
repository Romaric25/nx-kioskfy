# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────
# kioskfy API — NestJS server
#
# Build from the monorepo root (workspace packages are required):
#   docker build -f apps/api/Dockerfile -t kioskfy-api .
#
# Run:
#   docker run -p 3000:3000 --env-file apps/api/.env kioskfy-api
# ──────────────────────────────────────────────────────────────

# ── Dependencies (npm workspaces) ─────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

# Copy every workspace manifest so `npm ci` can resolve the lockfile.
COPY package.json package-lock.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/

# --include=dev : Coolify/CI peuvent injecter NODE_ENV=production au build,
# ce qui ferait sauter les devDependencies (nest CLI, tsc, vite...).
RUN npm ci --include=dev --no-audit --no-fund

# ── Build ─────────────────────────────────────────────────────
FROM deps AS build
COPY . .
# prebuild generates the workflow manifest + patches the SWC config,
# then `nest build` type-checks and compiles to apps/api/dist.
RUN npm run build -w @kioskfy/api

# ── Runtime ───────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Node modules + workspace packages (symlinks need their targets).
# apps/api has nested workspace-level modules (e.g. @workflow/nest).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY packages/ ./packages/

# Built application.
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api
EXPOSE 3000

# Configuration comes from the environment (see apps/api/.env.example).
CMD ["node", "dist/src/main.js"]
