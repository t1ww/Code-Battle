# ts-code-runner/Dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY ts-code-runner/package*.json ./ts-code-runner/

# If this service is plain JS:
RUN npm install --workspace=ts-code-runner --production

# If TS: use --include=dev and build pattern like backend

COPY ts-code-runner ./ts-code-runner

EXPOSE 5001
CMD ["npm", "run", "tcr"]
