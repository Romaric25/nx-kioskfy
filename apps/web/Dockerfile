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
# Copie UNIQUEMENT les manifests des workspaces : la couche npm ci reste
# cachée tant que les dépendances ne changent pas (une modification de
# source invaliderait sinon tout le téléchargement sur le serveur de build).
COPY package.json package-lock.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/organization/package.json apps/organization/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/auth-client/package.json packages/auth-client/package.json
COPY packages/hooks/package.json packages/hooks/package.json
COPY packages/stores/package.json packages/stores/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json

# --include=dev : Coolify/CI peuvent injecter NODE_ENV=production au build,
# ce qui ferait sauter les devDependencies (vite, typescript...).
# --ignore-scripts : les binaires natifs (esbuild...) sont fournis par les
# deps optionnelles par plateforme ; les postinstall (ex: vieux esbuild de
# drizzle-kit) plantent en ETXTBSY sur Linux/musl.
# --fetch-retries : le réseau du serveur coupe parfois la connexion au
# registry npm (ECONNRESET) — on réessaie au lieu d'échouer directement.
RUN npm ci --include=dev --ignore-scripts --no-audit --no-fund \
    --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

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
