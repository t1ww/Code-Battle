# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY frontend/code-battle/package*.json ./frontend/code-battle/

RUN npm install --workspace=frontend/code-battle

COPY frontend/code-battle ./frontend/code-battle

RUN npm run build --prefix frontend/code-battle

# Serve stage
FROM nginx:alpine

COPY --from=build /app/frontend/code-battle/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
