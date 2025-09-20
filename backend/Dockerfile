# backend/Dockerfile
# Stage 1 — build (needs dev deps to compile TS)
FROM node:20-alpine AS build
WORKDIR /app

# copy root and workspace package files so npm workspace works
COPY package*.json ./
COPY backend/package*.json ./backend/

# install deps for backend (including dev for building)
RUN npm install --workspace=backend --include=dev

# copy backend source
COPY backend ./backend

# build TS into backend/dist (requires backend/tsconfig.json outDir: "./dist")
RUN npm run build --prefix backend

# Stage 2 — runtime (production)
FROM node:20-alpine
WORKDIR /app

# copy only package files used to install prod deps
COPY package*.json ./
COPY backend/package*.json ./backend/

# install production deps only
RUN npm install --workspace=backend --production

# copy built files from build stage
COPY --from=build /app/backend/dist ./backend/dist

# optionally copy any runtime assets or migrations if needed:
# COPY backend/migrations ./backend/migrations

EXPOSE 5000
# run compiled JS (ensure server entry is backend/dist/server.js)
CMD ["node", "backend/dist/server.js"]
