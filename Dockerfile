# syntax=docker/dockerfile:1

# Multi-stage: base runtime
FROM node:20-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Copy source (no dependencies required for core app)
COPY api ./api
COPY web ./web
COPY tools ./tools

# Non-root user for safety
USER node

EXPOSE 3000

CMD ["node", "api/src/index.js"]

