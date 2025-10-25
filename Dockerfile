FROM node:18-alpine AS builder

# Set env
WORKDIR /app

# Install deps untuk backend
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Install deps untuk client dan build
WORKDIR /app/client
RUN npm ci && npm run build

# === Stage kedua: runtime ===
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Install hanya production deps untuk backend
COPY package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY . .

# Copy hasil build frontend
COPY --from=builder /app/client/dist ./client/dist

# Install PM2 globally
RUN npm install -g pm2

EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
