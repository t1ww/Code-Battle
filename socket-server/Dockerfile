# socket-server/Dockerfile
# Stage 1 — build
FROM node:20-alpine AS build
WORKDIR /app

# Install build tools for compiling TS and native modules
RUN apk add --no-cache python3 make build-base openjdk17

# Set JAVA_HOME
ENV JAVA_HOME="/usr/lib/jvm/default-jvm"
ENV PATH="$PATH:$JAVA_HOME/bin"

# Verify installations
RUN g++ --version
RUN java --version

# Copy package files for workspace install
COPY package*.json ./ 
COPY socket-server/package*.json ./socket-server/

# Install dev dependencies
RUN npm install --workspace=socket-server --include=dev

# Copy source
COPY socket-server ./socket-server

# Build TypeScript
RUN npm run build --prefix socket-server

# Stage 2 — runtime
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies for g++ (needed for spawning at runtime)
RUN apk add --no-cache python3 make build-base openjdk17

# Set JAVA_HOME
ENV JAVA_HOME="/usr/lib/jvm/default-jvm"
ENV PATH="$PATH:$JAVA_HOME/bin"

# Copy package files and install production deps
COPY package*.json ./ 
COPY socket-server/package*.json ./socket-server/
RUN npm install --workspace=socket-server --production

# Copy built JS
COPY --from=build /app/socket-server/dist ./socket-server/dist

EXPOSE 3001
CMD ["node", "socket-server/dist/server.js"]
