# Code Battle

**Senior Project – CAMT SE65**
A real-time code battle web app with live multiplayer functionality, built as a full-stack monorepo.

---

## 🚀 Quick Start Guide

Follow these steps to set up and run the entire Code Battle project from scratch.

---

### 1. Prerequisites

Before you begin, make sure you have these tools installed:

## Node.js & npm
  _Download and install from the [official website](https://nodejs.org/). This is required to run the project._

_You can check if Node.js and npm are installed by running:_

```bash
node -v
npm -v
```

  **⚠️After installing Node.js, please close and re-open VS Code to ensure the terminal recognizes the new installation. ⚠️**

## Docker Desktop  
  _Download and install [from here](https://www.docker.com/products/docker-desktop/), to run the database and phpMyAdmin containers._

_You can check if Docker is running by opening Docker Desktop or running:_

```bash
docker info
```

## g++ / GCC Compiler (required for C++ code runner)

> _Note: After you're done you can see expected output below._

### Windows

1. Install [MinGW-w64](https://sourceforge.net/projects/mingw)
   You can also follow this [YouTube Tutorial](https://www.youtube.com/watch?v=JsO58opI3SQ)
2. Add `C:\<path-to-gcc>\bin` to your system `PATH`.
3. Open a new terminal and verify installation:

```bash
g++ --version
```

---

### macOS

Install Xcode Command Line Tools:

```bash
xcode-select --install
g++ --version
```

---

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install build-essential
g++ --version
```

---

### Expected Output

You should see something like:

```
g++ (MinGW.org GCC-6.3.0-1) 6.3.0
Copyright (C) 2016 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```
  **⚠️After installing MinGW, please close and re-open VS Code to ensure the terminal recognizes the new installation. ⚠️**

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

### 4. Set Up Supabase

1. Create a project at [Supabase](https://supabase.com/).
2. Obtain your **Project URL** and **anon/public key**.
3. Copy `.env.example` to `.env` in the `backend` folder:

```bash
cp backend/.env.example backend/.env
```

4. **Generate a secure JWT secret:**  
You can use the built-in script to generate a random JWT secret key:

```bash
npm run jwt
```

Copy the output and paste it into the `JWT_SECRET` field in your `backend/.env` file.

Edit `backend/.env` if you need to change any values (like database credentials or JWT secret).

---

5. Replace database values with Supabase credentials:

```
DB_HOST=<supabase-db-host>
DB_PORT=5432
DB_NAME=<supabase-db-name>
DB_USER=<supabase-db-user>
DB_PASSWORD=<supabase-db-password>
JWT_SECRET=<random-secret>
```

> 🔒 Keep Supabase keys secret and never commit them.

---

### 5. Run Database Migrations and Seed Data

Create tables and insert initial data:

```bash
npm run be:db:migrate
npm run be:db:seed
```

These now run against your Supabase PostgreSQL database.

---

### 6. Start All Project Servers

```bash
npm run dev
```

This runs all services concurrently. Press Ctrl+C to stop.

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:5000](http://localhost:5000)
* **Socket Server:** [http://localhost:3001](http://localhost:3001)
* **Code Runner:** [http://localhost:5001](http://localhost:5001)

---

## 🧩 Project Structure

| Folder                  | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `backend/`              | Express.js API server, Supabase PostgreSQL, code validation |
| `frontend/code-battle/` | Vue 3 web app with Monaco Editor                            |
| `ts-code-runner/`       | Isolated TypeScript runner for user-submitted code          |
| `socket-server/`        | WebSocket (Socket.IO) server                                |

---

## 🧪 Tech Stack

| Layer       | Stack                                            |
| ----------- | ------------------------------------------------ |
| Frontend    | Vue 3 + Vite + monaco-editor                     |
| Backend     | Node.js + Express + Knex + PostgreSQL (Supabase) |
| Realtime    | Socket.IO                                        |
| Code Runner | Sandboxed TS executor                            |
| Testing     | Jest + mock-req-res                              |

---

## 📚 More Documentation

* [Command Scripts](commands.md)
* [API Documentation](API.md)
* [Tech stacks](TechStack.md)
* [Submit Issues](https://github.com/t1ww/Code-Battle/issues)

---