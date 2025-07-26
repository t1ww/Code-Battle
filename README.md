# Code Battle

**Senior Project – CAMT SE65**
Real-time code battle web app with live multiplayer functionality, built as a full-stack monorepo.

---

## API Documentation

Detailed API endpoints and usage are documented in [API.md](API.md).

## 🧩 Project Structure

This repo uses workspaces and is organized into 4 main components:

| Folder                  | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `backend/`              | Express.js API server, PostgreSQL DB, code validation    |
| `frontend/code-battle/` | Vue 3 web app with Monaco Editor for coding interface    |
| `ts-code-runner/`       | Isolated TypeScript runner for user-submitted code       |
| `socket-server/`        | WebSocket (Socket.IO) server for real-time communication |

---

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

Installs all workspace dependencies.

### 2. 🐳 Docker Setup (Database)

You can run the MySQL database and phpMyAdmin using Docker Compose.

### Start MySQL & phpMyAdmin containers:

```bash
docker-compose -p Code-Battle up -d
```

### Access phpMyAdmin at:

```
http://localhost:8081
```

Use the following credentials:

* Host: `mysql`
* Port: `3306`
* Username: `root`
* Password: `root_password`
* Database: `my_database`

### Stop containers:

```bash
docker-compose down
```

---

Ensure your `knexfile.ts` matches these credentials to connect your backend to the MySQL container.

### 3. Start Development

* Backend only: `npm run backend`
* Frontend only: `npm run frontend`
* TS Runner only: `npm run ts-code-runner`
* Socket Server only: `npm run socket-server`
* Start both frontend & backend: `npm run dev`
* Start everything (all 4): `npm run all`

### 4. Stop All Servers (Windows only)

```bash
npm run stop
```

Kills all opened `cmd.exe` sessions.

---
---
---

## ⚙️ Knex Usage (Database)

Make sure `knexfile.ts` is configured properly with your local DB credentials.

### Create Migration

```bash
npx knex migrate:make <filename>
```

### Run Migrations

```bash
npm run be:db:migrate
```

### Roll Back All Migrations

```bash
npm run be:db:rollback
```

### Reset & Seed (if implemented)

```bash
npm run be:db:reset
```

---

## 🧼 Tip: Fixing Stuck Ports (Windows)

If a server crashes or port remains stuck:

1. **Find the PID:**

```bash
netstat -ano | findstr :<PORT>
```

2. **Kill it:**

```bash
taskkill /pid <PID> /f
```

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

## 📁 Repository

GitHub: [Code-Battle](https://github.com/t1ww/Code-Battle)
Issues: [Submit Bug Reports](https://github.com/t1ww/Code-Battle/issues)

---