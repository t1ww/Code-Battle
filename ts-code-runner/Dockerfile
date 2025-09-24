# ts-code-runner\Dockerfile
# Stage 1 — build
FROM node:20-alpine AS build
WORKDIR /app

# Update package lists and install g++ and a Java JDK
# For g++, install 'build-essential' which includes g++ and other build tools.
# For Java JDK, install 'openjdk-17-jdk' (or another desired version like 'openjdk-11-jdk').
RUN apt-get update && \
    apt-get install -y build-essential openjdk-17-jdk && \
    rm -rf /var/lib/apt/lists/*

# Set the JAVA_HOME environment variable (adjust path if using a different JDK version)
ENV JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
ENV PATH="$JAVA_HOME/bin:$PATH"

# Verify installations (optional, but good for debugging)
RUN g++ --version
RUN java -version
RUN javac -version


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
