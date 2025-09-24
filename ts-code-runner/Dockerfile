# ts-code-runner\Dockerfile
# Stage 1 — build
FROM node:20-alpine AS build
WORKDIR /app

# install build tools for native deps
RUN apk add --no-cache python3 make build-base

COPY package*.json ./ 
COPY ts-code-runner/package*.json ./ts-code-runner/

# Install dev deps to build
RUN npm install --workspace=ts-code-runner --include=dev

COPY ts-code-runner ./ts-code-runner

# Build TS to dist
RUN npm run build --prefix ts-code-runner

# Stage 2 — runtime
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./ 
COPY ts-code-runner/package*.json ./ts-code-runner/

# Install only production deps
RUN npm install --workspace=ts-code-runner --production

# Copy built JS
COPY --from=build /app/ts-code-runner/dist ./ts-code-runner/dist

EXPOSE 5001
CMD ["node", "ts-code-runner/dist/server.js"]
