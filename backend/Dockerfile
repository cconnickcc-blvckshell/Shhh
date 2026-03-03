# Shhh Backend API — production image
FROM node:22-alpine

WORKDIR /app

# Dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
