# Code Battle — NPM Scripts

## JWT & Utilities

| Command              | Description                                         |
| -------------------- | --------------------------------------------------- |
| `npm run jwt`        | Generate a secure JWT secret for the backend `.env` |
| `npm run team-bot`   | Run the team join bot (`nodemon`)                   |
| `npm run kill-ports` | Kill all ports used by services                     |

## Frontend

| Command                                  | Description                      |
| ---------------------------------------- | -------------------------------- |
| `npm run fe` / `npm run frontend`        | Start the frontend app           |
| `npm run tcr` / `npm run ts-code-runner` | Start the TypeScript code runner |
| `npm run ss` / `npm run socket-server`   | Start the socket server          |

## Backend

| Command                                                  | Description                                       |
| -------------------------------------------------------- | ------------------------------------------------- |
| `npm run be` / `npm run backend`                         | Start the backend server                          |
| `npm run be:test` / `npm run backend:test`               | Run backend tests                                 |
| `npm run be:db:migrate`                                  | Run latest database migrations                    |
| `npm run be:db:rollback`                                 | Rollback all migrations                           |
| `npm run be:db:seed` / `npm run backend:database:seed`   | Seed database with initial data                   |
| `npm run be:db:reset` / `npm run backend:database:reset` | Reset the database (drop all tables + migrations) |

## Full Dev Environment

| Command       | Description                                                                            |
| ------------- | -------------------------------------------------------------------------------------- |
| `npm run dev` | Kill used ports and run backend, frontend, code runner, and socket server concurrently |

---