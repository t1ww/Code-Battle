# ts-code-runner/Dockerfile
# Stage 1 — build
FROM node:20-alpine AS build
WORKDIR /app

# Install build tools and Java
RUN apk add --no-cache python3 make build-base openjdk17

# Set JAVA_HOME
ENV JAVA_HOME="/usr/lib/jvm/default-jvm"
ENV PATH="$PATH:$JAVA_HOME/bin"

# Verify installations
RUN g++ --version
RUN java --version
RUN javac -version

# Copy package files for workspace install
COPY package*.json ./ 
COPY ts-code-runner/package*.json ./ts-code-runner/

# Install dev dependencies
RUN npm install --workspace=ts-code-runner --include=dev

# Copy source
COPY ts-code-runner ./ts-code-runner

# Build TypeScript
RUN npm run build --prefix ts-code-runner

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
COPY ts-code-runner/package*.json ./ts-code-runner/
RUN npm install --workspace=ts-code-runner --production

# Copy built JS
COPY --from=build /app/ts-code-runner/dist ./ts-code-runner/dist

EXPOSE 5001
CMD ["node", "ts-code-runner/dist/server.js"]
