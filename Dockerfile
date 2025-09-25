FROM node:18-alpine

# Set environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Workdir
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Install PM2 globally
RUN npm install -g pm2

EXPOSE 3000

# Jalankan dengan PM2 cluster (pakai semua core: -i max)
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]

