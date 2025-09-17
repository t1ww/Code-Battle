FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm install --workspace=backend --production

COPY backend/src ./backend/src

EXPOSE 5000

CMD ["npm", "run", "be"]
