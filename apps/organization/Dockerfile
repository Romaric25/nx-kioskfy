# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────
# kioskfy Organization — TanStack Start agency portal
#
# Build from the monorepo root (workspace packages are required):
#   docker build -f apps/organization/Dockerfile -t kioskfy-organization .
#
# Run:
#   docker run -p 3002:3002 kioskfy-organization
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
# --ignore-scripts : les binaires natifs (esbuild...) sont fournis par les
# deps optionnelles par plateforme ; les postinstall (ex: vieux esbuild de
# drizzle-kit) plantent en ETXTBSY sur Linux/musl.
RUN npm ci --include=dev --ignore-scripts --no-audit --no-fund

# ── Build ─────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build -w @kioskfy/organization

# ── Runtime ───────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Node modules + workspace packages (symlinks need their targets).
COPY --from=deps /app/node_modules ./node_modules
COPY packages/ ./packages/
COPY package.json package-lock.json ./

# Application source + config, then the production build on top.
COPY apps/organization ./apps/organization
COPY --from=build /app/apps/organization/dist ./apps/organization/dist

WORKDIR /app/apps/organization
EXPOSE 3002

# `vite preview` serves the built SSR handler + static assets.
CMD ["npx", "vite", "preview", "--host", "--port", "3002"]
