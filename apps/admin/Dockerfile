# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────
# kioskfy Admin — TanStack Start admin panel
#
# Build from the monorepo root (workspace packages are required):
#   docker build -f apps/admin/Dockerfile -t kioskfy-admin .
#
# Run:
#   docker run -p 3001:3001 kioskfy-admin
# ──────────────────────────────────────────────────────────────

# ── Dependencies (npm workspaces) ─────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

# Copy every workspace manifest so `npm ci` can resolve the lockfile.
COPY package.json package-lock.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/

# --include=dev : Coolify/CI peuvent injecter NODE_ENV=production au build,
# ce qui ferait sauter les devDependencies (vite, typescript...).
RUN npm ci --include=dev --no-audit --no-fund

# ── Build ─────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build -w @kioskfy/admin

# ── Runtime ───────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Node modules + workspace packages (symlinks need their targets).
COPY --from=deps /app/node_modules ./node_modules
COPY packages/ ./packages/
COPY package.json package-lock.json ./

# Application source + config, then the production build on top.
COPY apps/admin ./apps/admin
COPY --from=build /app/apps/admin/dist ./apps/admin/dist

WORKDIR /app/apps/admin
EXPOSE 3001

# `vite preview` serves the built SSR handler + static assets.
CMD ["npx", "vite", "preview", "--host", "--port", "3001"]
