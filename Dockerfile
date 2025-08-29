FROM node:18

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Install netcat untuk wait script
# RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY . .

# Copy wait script dan beri permission
# COPY wait-for-redis.sh /wait-for-redis.sh
# RUN chmod +x /wait-for-redis.sh

EXPOSE 3000

# Gunakan wait script
CMD ["npm", "run", "dev"]