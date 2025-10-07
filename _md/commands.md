# Code Battle — NPM Scripts

## JWT & Utilities

| Command              | Description                                         |
| -------------------- | --------------------------------------------------- |
| `npm run jwt`        | Generate a secure JWT secret for the backend `.env` |
| `npm run team-bot`   | Run the team join bot (`nodemon`)                   |
| `npm run kill-ports` | Kill all ports used by services                     |

---

## Frontend

| Command                                  | Description                      |
| ---------------------------------------- | -------------------------------- |
| `npm run fe` / `npm run frontend`        | Start the frontend app           |
| `npm run build:frontend`                 | Build the frontend production    |
| `npm run tcr` / `npm run ts-code-runner` | Start the TypeScript code runner |
| `npm run ss` / `npm run socket-server`   | Start the socket server          |

---

## Backend

| Command                                                  | Description                                       |
| -------------------------------------------------------- | ------------------------------------------------- |
| `npm run be` / `npm run backend`                         | Start the backend server                          |
| `npm run be:test` / `npm run backend:test`               | Run backend tests                                 |
| `npm run be:db:migrate`                                  | Run latest database migrations                    |
| `npm run be:db:rollback`                                 | Rollback all migrations                           |
| `npm run be:db:seed` / `npm run backend:database:seed`   | Seed database with initial data                   |
| `npm run be:db:reset` / `npm run backend:database:reset` | Reset the database (drop all tables + migrations) |
| `npm run build:backend`                                  | Build the backend production                      |

---

## Docker Commands

| Command                                                    | Description                                |
| ---------------------------------------------------------- | ------------------------------------------ |
| `npm run docker:build:frontend` / `docker:build:fe`        | Build Docker image for frontend            |
| `npm run docker:build:backend` / `docker:build:be`         | Build Docker image for backend             |
| `npm run docker:build:ts-code-runner` / `docker:build:tcr` | Build Docker image for TypeScript runner   |
| `npm run docker:build:socket-server` / `docker:build:ss`   | Build Docker image for socket server       |
| `npm run docker:build:all`                                 | Build all Docker images                    |
| `npm run docker:push:frontend` / `docker:push:fe`          | Push frontend image to Docker Hub          |
| `npm run docker:push:backend` / `docker:push:be`           | Push backend image to Docker Hub           |
| `npm run docker:push:ts-code-runner` / `docker:push:tcr`   | Push TypeScript runner image to Docker Hub |
| `npm run docker:push:socket-server` / `docker:push:ss`     | Push socket server image to Docker Hub     |

---

## Full Dev Environment

| Command       | Description                                                                            |
| ------------- | -------------------------------------------------------------------------------------- |
| `npm run dev` | Kill used ports and run backend, frontend, code runner, and socket server concurrently |

---

## Workspace Overview

| Workspace Path          | Purpose / Description                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `backend/`              | Express.js + Knex backend server, including authentication and database migrations. |
| `frontend/code-battle/` | Vue 3 (Vite) frontend application with Monaco Editor integration.                   |
| `ts-code-runner/`       | TypeScript execution service used to safely run submitted code.                     |
| `socket-server/`        | Real-time WebSocket server handling multiplayer communication.                      |
| `util_scripts/`         | Utility scripts such as JWT generator, port killer, and team join bot.              |

---