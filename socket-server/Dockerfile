# socket-server/Dockerfile
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
