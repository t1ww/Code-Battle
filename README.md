# Code Battle

**Senior Project – CAMT SE65**  
A real-time code battle web app with live multiplayer functionality, built as a full-stack monorepo.

---

## 🚀 Quick Start Guide

Follow these steps to set up and run the entire Code Battle project from scratch.

### 1. Prerequisites

- [Node.js & npm](https://nodejs.org/) installed
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed

---

### 2. Clone the Repository

```bash
git clone https://github.com/t1ww/Code-Battle.git
cd Code-Battle
```

---

### 3. Install All Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (backend, frontend, code runner, socket server).

---

### 4. Start the Database with Docker

Run MySQL and phpMyAdmin using Docker Compose:

```bash
docker-compose -p Code-Battle up -d
```

- **phpMyAdmin:** [http://localhost:8081](http://localhost:8081)
- **Credentials:**
  - Host: `mysql`
  - Port: `3306`
  - Username: `root`
  - Password: `root_password`
  - Database: `my_database`

---

### 5. Configure Backend Database Connection

Make sure your `backend/knexfile.ts` uses the same database credentials as above.

---

### 6. Run Database Migrations and Seed Data

Set up the database tables and add initial data:

```bash
npm run be:db:migrate
npm run be:db:seed
```

---

### 7. Start All Project Servers

To run everything (backend, frontend, code runner, socket server):

```bash
npm run all
```

This will open separate terminal windows for each service.

- **Frontend:** [http://localhost:5173](http://localhost:5173) (Vite default)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Socket Server:** [http://localhost:3001](http://localhost:3001)
- **Code Runner:** [http://localhost:5001](http://localhost:5001)

_If any port is busy, check your terminal output for the actual port used._
---

### 8. Stop All Servers (Windows Only)

To close all running servers:

```bash
npm run stop
```

---

## 🧩 Project Structure

| Folder                  | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `backend/`              | Express.js API server, PostgreSQL DB, code validation    |
| `frontend/code-battle/` | Vue 3 web app with Monaco Editor for coding interface    |
| `ts-code-runner/`       | Isolated TypeScript runner for user-submitted code       |
| `socket-server/`        | WebSocket (Socket.IO) server for real-time communication |

---

## 🧪 Tech Stack

| Layer       | Stack                         |
| ----------- | ----------------------------- |
| Frontend    | Vue 3 + Vite + monaco-editor  |
| Backend     | Node.js + Express + Knex + PG |
| Realtime    | Socket.IO                     |
| Code Runner | Sandboxed TS executor         |
| Testing     | Jest + mock-req-res           |

---

## 📚 More Documentation

- [API Documentation](API.md)
- [Submit Issues](https://github.com/t1ww/Code-Battle/issues)

---