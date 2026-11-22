FROM node:24-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Package lists first so Docker can skip the slow install when only code changed.
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main"]