# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────
# kioskfy Web — TanStack Start storefront
#
# Build from the monorepo root (workspace packages are required):
#   docker build -f apps/web/Dockerfile -t kioskfy-web .
#
# Run:
#   docker run -p 3003:3003 kioskfy-web
# ──────────────────────────────────────────────────────────────

# ── Dependencies (npm workspaces) ─────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

# Copy every workspace manifest so `npm ci` can resolve the lockfile.
COPY package.json package-lock.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/

RUN npm ci --no-audit --no-fund

# ── Build ─────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build -w @kioskfy/web

# ── Runtime ───────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Node modules + workspace packages (symlinks need their targets).
COPY --from=deps /app/node_modules ./node_modules
COPY packages/ ./packages/
COPY package.json package-lock.json ./

# Application source + config, then the production build on top.
COPY apps/web ./apps/web
COPY --from=build /app/apps/web/dist ./apps/web/dist

WORKDIR /app/apps/web
EXPOSE 3003

# `vite preview` serves the built SSR handler + static assets.
CMD ["npx", "vite", "preview", "--host", "--port", "3003"]
