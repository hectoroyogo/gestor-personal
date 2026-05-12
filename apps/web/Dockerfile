FROM node:24-alpine AS base
WORKDIR /workspace
RUN apk add --no-cache libc6-compat openssl wget
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/ui-tokens/package.json packages/ui-tokens/package.json
RUN pnpm install --no-frozen-lockfile

FROM deps AS development
COPY . .
CMD ["sh", "-c", "pnpm install --no-frozen-lockfile && pnpm --filter @gestor/db prisma:generate && pnpm --filter @gestor/db prisma:deploy && pnpm --filter @gestor/web dev"]

FROM deps AS builder
COPY . .
RUN pnpm --filter @gestor/db prisma:generate
RUN pnpm --filter @gestor/web build

FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps/web/.next ./apps/web/.next
COPY --from=builder /workspace/apps/web/package.json ./apps/web/package.json
COPY --from=builder /workspace/apps/web/public ./apps/web/public
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /workspace/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=builder /workspace/apps/web/next-env.d.ts ./apps/web/next-env.d.ts
WORKDIR /workspace/apps/web
EXPOSE 3000
CMD ["sh", "-c", "cd /workspace/packages/db && pnpm prisma:deploy && cd /workspace/apps/web && pnpm start"]
