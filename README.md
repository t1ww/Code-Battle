# Code Battle

**Senior Project – CAMT SE65**  
A real-time code battle web app with live multiplayer functionality, built as a full-stack monorepo.

---

## 🚀 Quick Start Guide

Follow these steps to set up and run the entire Code Battle project from scratch.

### 1. Prerequisites

Before you begin, make sure you have these tools installed:

- [Node.js & npm](https://nodejs.org/)  
  _Download and install from the official website. This is required to run the project._
  **After installing Node.js, please close and re-open VS Code to ensure the terminal recognizes the new installation.**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)  
  _Download and install to run the database and phpMyAdmin containers._

_You can check if Node.js and npm are installed by running:_

```bash
node -v
npm -v
```

_You can check if Docker is running by opening Docker Desktop or running:_

```bash
docker info
```

---

### 2. Clone the Repository (If you haven't)

```bash
git clone https://github.com/t1ww/Code-Battle.git
cd Code-Battle
```

---

### 3. Install All Dependencies

**⚠️ Windows PowerShell Users: Fix "running scripts is disabled" Error**

If you see an error like:

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

You need to change your PowerShell execution policy **before running `npm install`**:

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

After running the command, restart your terminal or VS Code.

---

In your terminal, make sure you are in the **root folder** (`Code-Battle`), then run:

```bash
npm install
```

This will install dependencies for all workspaces (backend, frontend, code runner, socket server).

---

### 4.1. Start the Database with Docker

Copy `.env.docker.example` to `.env.docker` in the project root:

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` if you need to change any values.

Docker Compose will automatically use variables from `.env.docker` if you run:

```bash
docker-compose --env-file .env.docker -p code_battle up -d
```

- **phpMyAdmin:** [http://localhost:8081](http://localhost:8081)
  **Example Credentials**
  - Username: `root`
  - Password: `root_password`

---
> ⚠️ **Security Warning:**  
> Example credentials (like `root_password`, `user_password`) are used for local development only.  
> **Never use these in production!**  
> Always change all passwords and secrets before deploying, and use environment variables or secret management tools to keep credentials
---

### 4.2. To stop and remove Docker Containers
_This step is optional. Only run these commands if you want to stop and remove the Docker containers and data._

To stop and remove all Docker containers, networks, and volumes created by Docker Compose, run:

```bash
docker-compose --env-file .env.docker -p code_battle down
```

To also remove all volumes (delete database data):

```bash
docker-compose --env-file .env.docker -p code_battle down --volumes
```

---

### 5. Set Up Environment Variables

Copy `.env.example` to `.env` in the `backend` folder and fill in any secrets:

```bash
cp backend/.env.example backend/.env
```

**Generate a secure JWT secret:**  
You can use the built-in script to generate a random JWT secret key:

```bash
npm run jwt
```

Copy the output and paste it into the `JWT_SECRET` field in your `backend/.env` file.

Edit `backend/.env` if you need to change any values (like database credentials or JWT secret).

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
npm run dev
```

This runs all services concurrently in one terminal. You can stop all servers safely at any time by pressing Ctrl+C.

- **Frontend:** [http://localhost:5173](http://localhost:5173) (Vite default)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Socket Server:** [http://localhost:3001](http://localhost:3001)
- **Code Runner:** [http://localhost:5001](http://localhost:5001)

_If any port is busy, check your terminal output for the actual port used._
---

## 🧩 Project Structure

| Folder                  | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `backend/`              | Express.js API server, MySQL DB, code validation    |
| `frontend/code-battle/` | Vue 3 web app with Monaco Editor for coding interface    |
| `ts-code-runner/`       | Isolated TypeScript runner for user-submitted code       |
| `socket-server/`        | WebSocket (Socket.IO) server for real-time communication |

---

## 🧪 Tech Stack

| Layer       | Stack                         |
| ----------- | ----------------------------- |
| Frontend    | Vue 3 + Vite + monaco-editor  |
| Backend     | Node.js + Express + Knex + MySQL |
| Realtime    | Socket.IO                     |
| Code Runner | Sandboxed TS executor         |
| Testing     | Jest + mock-req-res           |

---

## 📚 More Documentation

- [API Documentation](API.md)
- [Submit Issues](https://github.com/t1ww/Code-Battle/issues)

---