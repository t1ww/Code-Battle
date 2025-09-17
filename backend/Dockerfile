# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy root package.json & backend workspace package.json
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies for backend only
RUN npm install --workspace=backend --production

# Copy backend source code
COPY backend ./backend

# Expose port
EXPOSE 5000

# Run migrations & seed (optional, can remove in production)
RUN npx knex migrate:latest --knexfile backend/knexfile.ts --cwd backend
RUN npm run be:db:seed --workspace=backend

# Start backend
CMD ["npm", "run", "be"]
