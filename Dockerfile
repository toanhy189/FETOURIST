FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Mở cổng 3000 cho Next.js
EXPOSE 3000

# Lệnh khởi chạy Next.js (chế độ dev)
CMD ["npm", "run", "dev"]