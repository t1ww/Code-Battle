# frontend/code-battle/Dockerfile
# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app

# copy root and frontend package so workspace installs work
COPY package*.json ./
COPY frontend/code-battle/package*.json ./frontend/code-battle/

# install frontend deps (include dev so vite/vue-tsc/monaco are available)
RUN npm install --workspace=frontend/code-battle --include=dev

# copy frontend source
COPY frontend/code-battle ./frontend/code-battle

# build the app
RUN npm run build --prefix frontend/code-battle

# Stage 2: serve with nginx
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/frontend/code-battle/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
