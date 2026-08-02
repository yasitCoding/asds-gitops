# Multi-stage Dockerfile for DevSecOps Target Application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app

# Security: Run as non-root user
USER node

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/

EXPOSE 8080

CMD ["node", "src/app.js"]
