FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY socket-server/package*.json ./socket-server/

RUN npm install --workspace=socket-server --production

COPY socket-server ./socket-server

EXPOSE 3001

CMD ["npm", "run", "ss"]
