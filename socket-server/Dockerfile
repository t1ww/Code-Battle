# socket-server/Dockerfile
# Stage 1 — build
FROM node:20-alpine AS build
WORKDIR /app

# copy root + socket package.json for workspace install
COPY package*.json ./
COPY socket-server/package*.json ./socket-server/

# install dev dependencies for build
RUN npm install --workspace=socket-server --include=dev

# copy source
COPY socket-server ./socket-server

# build TypeScript to dist
RUN npm run build --prefix socket-server

# Stage 2 — runtime
FROM node:20-alpine
WORKDIR /app

# copy package.json for production install
COPY package*.json ./
COPY socket-server/package*.json ./socket-server/

# install only production deps
RUN npm install --workspace=socket-server --production

# copy built dist from build stage
COPY --from=build /app/socket-server/dist ./socket-server/dist

EXPOSE 3001
CMD ["node", "socket-server/dist/server.js"]
