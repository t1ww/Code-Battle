FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY ts-code-runner/package*.json ./ts-code-runner/

RUN npm install --workspace=ts-code-runner --production

COPY ts-code-runner ./ts-code-runner

EXPOSE 5001

CMD ["npm", "run", "tcr"]
