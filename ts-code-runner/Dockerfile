# socket-server/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY socket-server/package*.json ./socket-server/

RUN npm install --workspace=socket-server --production

COPY socket-server/src ./socket-server/src

EXPOSE 3001

CMD ["npm", "run", "ss"]
