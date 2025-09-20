# socket-server/Dockerfile
FROM node:20-alpine
WORKDIR /app

# copy root + socket package so workspace install works
COPY package*.json ./
COPY socket-server/package*.json ./socket-server/

# install only production deps (socket is runtime JS/TS? if TS, include dev and build step)
RUN npm install --workspace=socket-server --production

# copy the source
COPY socket-server ./socket-server

# If socket-server is TypeScript and needs build, change above to include dev/install+build similar to backend.

EXPOSE 3001
CMD ["npm", "run", "ss"]
