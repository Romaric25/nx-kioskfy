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
# ce qui ferait sauter les devDependencies (nest CLI, tsc, vite...).
# --ignore-scripts : les binaires natifs (esbuild, swc, sharp, argon2) sont
# fournis par les deps optionnelles par plateforme ; les postinstall
# (ex: vieux esbuild de drizzle-kit) plantent en ETXTBSY sur Linux/musl.
# --fetch-retries : le réseau du serveur coupe parfois la connexion au
# registry npm (ECONNRESET) — on réessaie au lieu d'échouer directement.
# Le fallback vérifie que les binaires natifs (SWC, sharp) ont bien été
# installés (échec silencieux possible des deps optionnelles) et
# réinstalle tout proprement sinon.
RUN npm ci --include=dev --ignore-scripts --no-audit --no-fund \
      --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=600000 \
    && node -e "require('@swc/core'); require('sharp')" \
    || (npm cache clean --force && npm ci --include=dev --ignore-scripts --no-audit --no-fund \
        --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=600000)

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
