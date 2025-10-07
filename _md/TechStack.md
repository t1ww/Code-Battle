# Code Battle – Tech Stack

## Frontend

| Tool / Library   | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| Vue 3 + Vite     | Core framework for reactive UI and fast development |
| Vue Router       | Client-side routing for single-page application     |
| Pinia            | State management library for Vue 3                  |
| monaco-editor    | Code editor for in-browser coding experience        |
| Axios            | API calls to backend                                |
| Socket.IO Client | Real-time communication with backend socket server  |
| NProgress        | Loading progress bars for route transitions         |

## Backend

| Tool / Library        | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| Node.js + Express     | REST API server                                |
| Knex.js               | SQL query builder & migration tool             |
| PostgreSQL (Supabase) | Relational database and authentication backend |
| dotenv                | Environment variable management                |
| bcrypt / JWT          | Password hashing & JWT-based authentication    |

## Real-time / Multiplayer

| Tool / Library    | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| Node.js + Express | Base server framework for WebSocket endpoints          |
| Socket.IO         | Real-time communication layer for multiplayer features |
| TypeScript        | Strong typing and maintainable socket event structure  |
| dotenv            | Manage environment variables for runtime configuration |
| uuid              | Generate unique room/session identifiers               |
| axios             | Make internal API calls to backend or other services   |

## Code Runner

| Tool / Library                 | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| Node.js + TypeScript + Express | Executes and validates user-submitted code safely  |
| child_process                  | Spawns isolated processes for C++/JS execution     |
| fs-extra                       | File handling for temporary code files             |
| cors                           | Handles cross-origin requests                      |
| dotenv                         | Environment variable management                    |
| body-parser                    | Parse incoming request bodies (JSON / URL-encoded) |

## Testing

| Tool / Library | Purpose                                   |
| -------------- | ----------------------------------------- |
| Jest + ts-jest | Unit testing for backend and TS code      |
| mock-req-res   | Mocking HTTP requests/responses for tests |

## Utilities / Dev Tools

| Tool / Library          | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| concurrently            | Run multiple servers/workspaces in one terminal |
| nodemon                 | Auto-restart servers during development         |
| ts-node                 | Run TypeScript files without compiling          |
| detect-port / kill-port | Port management for dev workflow                |

## OS / Language Requirements

| Tool / Library | Purpose                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| g++ / GCC      | Compile and run C++ code (required for code runner)                      |
| Node.js ≥ 20   | Backend & dev tooling                                                    |
| Supabase       | Cloud-hosted PostgreSQL database + authentication                        |
| Docker Desktop | Required for building, managing, and pushing Docker images to Docker Hub |

---