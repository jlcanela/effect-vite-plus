FROM node:25-alpine AS builder
WORKDIR /app

# Copy root pnpm store and workspace manifests
COPY dist/index.mjs ./index.mjs

EXPOSE 3000

CMD ["node", "index.mjs"]

