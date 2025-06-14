# Gunakan Node.js versi LTS sebagai base image
FROM node:18

# Tetapkan environment variable untuk production atau development
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Tentukan working directory di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json untuk instalasi dependencies
COPY package.json package-lock.json ./

# Instal dependencies
RUN npm i

# Install netcat-openbsd (provides nc)
RUN apt-get update && apt-get install -y netcat-openbsd

# Salin semua file proyek ke dalam container, kecuali yang ada di .dockerignore
COPY . .

# Tetapkan port yang digunakan oleh aplikasi
EXPOSE 3000

# Perintah untuk menjalankan server
CMD ["npm", "run", "dev"]