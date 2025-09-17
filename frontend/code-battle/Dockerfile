# Stage 1: build
FROM node:20-alpine AS build

WORKDIR /app

# Copy root package.json & lock file
COPY package*.json ./

# Copy frontend package.json
COPY frontend/code-battle/package*.json ./frontend/code-battle/

# Install all dependencies (dev + prod)
RUN npm install --workspace=frontend/code-battle --include=dev

# Copy frontend source code
COPY frontend/code-battle ./frontend/code-battle

# Build the frontend
RUN npm run build --prefix frontend/code-battle

# Stage 2: serve with nginx
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/frontend/code-battle/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
