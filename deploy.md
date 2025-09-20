# Code Battle — Deployment Guide

This document explains how to deploy the **Code Battle** monorepo to Docker Hub and hosting services like Render.  

---

## 📂 Project Structure

The repository is a **Node.js monorepo** managed with `npm workspaces`.  
Here’s the tree of deployable services:

```

code-battle/
├── backend/               # REST API (Express + Knex + PostgreSQL)
│   └── src/               # TypeScript source (compiled to dist/)
│
├── frontend/code-battle/  # Vue 3 + Vite frontend
│   └── src/               # Vue components & pages
│
├── socket-server/         # WebSocket server (Express + Socket.IO)
│   └── src/               # TypeScript source
│
├── ts-code-runner/        # Sandbox service to run submitted code
│   └── src/               # TypeScript/JS scripts
│
├── util\_scripts/          # Development utilities (not deployed)
└── package.json           # Root workspace configuration

````

Each service has its own `package.json`, scripts, and `Dockerfile`.

---

## 🐳 Docker Build & Push

Make sure you are logged in to Docker Hub, and docker desktop is opened:

```sh
docker login
````

From the **repo root**, build and push each image.
(Replace `t1ww` with your Docker Hub username if different.)

```sh
# Backend (API server)
docker build -t t1ww/code-battle-backend:latest -f backend/Dockerfile .
docker push t1ww/code-battle-backend:latest

# Socket Server (WebSocket)
docker build -t t1ww/code-battle-socket:latest -f socket-server/Dockerfile .
docker push t1ww/code-battle-socket:latest

# TS Code Runner (execution sandbox)
docker build -t t1ww/code-battle-tcr:latest -f ts-code-runner/Dockerfile .
docker push t1ww/code-battle-tcr:latest

# Frontend (Vue 3 + Vite, served by Nginx)
docker build -t t1ww/code-battle-frontend:latest -f frontend/code-battle/Dockerfile .
docker push t1ww/code-battle-frontend:latest
```

---

## ▶️ Running Containers Locally

You can test each service locally before deploying.

```sh
# Backend (port 5000, with .env file)
docker run --env-file ./backend/.env -p 5000:5000 t1ww/code-battle-backend:latest

# Socket Server (port 3001)
docker run -p 3001:3001 t1ww/code-battle-socket:latest

# TS Code Runner (port 5001)
docker run -p 5001:5001 t1ww/code-battle-tcr:latest

# Frontend (served by Nginx on port 8080)
docker run -p 8080:80 t1ww/code-battle-frontend:latest
```

---

## 🌐 Render Deployment

For Render, create **four services** (one per image):

| Service          | Docker Image (Docker Hub)          | Port |
| ---------------- | ---------------------------------- | ---- |
| Backend API      | `t1ww/code-battle-backend:latest`  | 5000 |
| Socket Server    | `t1ww/code-battle-socket:latest`   | 3001 |
| TS Code Runner   | `t1ww/code-battle-tcr:latest`      | 5001 |
| Frontend (Nginx) | `t1ww/code-battle-frontend:latest` | 80   |

### Backend API (Express + PostgreSQL)

* **Image**: `t1ww/code-battle-backend:latest`
* **Port**: `5000`
* **Environment Variables**:

  * `PORT=5000`
  * `DB_HOST=...`
  * `DB_USER=...`
  * `DB_PASSWORD=...`
  * `DB_NAME=...`

### Socket Server

* **Image**: `t1ww/code-battle-socket:latest`
* **Port**: `3001`

### TS Code Runner

* **Image**: `t1ww/code-battle-tcr:latest`
* **Port**: `5001`

### Frontend

* **Image**: `t1ww/code-battle-frontend:latest`
* **Port**: `80`
* Set **Custom Domain** if needed (e.g., `codebattle.app`).

---

## 📝 Notes & Gotchas

1. **TypeScript builds**

   * Backend and socket-server are written in TS. Their Dockerfiles **compile to `dist/`** before running.
   * Ensure `tsconfig.json` has `"outDir": "./dist"`.

2. **Frontend + Monaco Editor**

   * `monaco-editor` workers must be placed under `frontend/code-battle/public/monaco/...`.
   * They will be copied into `dist/` and served by Nginx automatically.

3. **Database**

   * Backend uses PostgreSQL. Run migrations manually:

     ```sh
     docker exec -it <backend-container-id> npm run migrate:latest --prefix backend
     ```

4. **Updating Images**

   * Rebuild, tag, push new images:

     ```sh
     docker build -t t1ww/code-battle-backend:<version> -f backend/Dockerfile .
     docker push t1ww/code-battle-backend:<version>
     ```
   * Update Render service to use the new tag.

---

## ✅ Quick Deploy Checklist

* [ ] Run `npm run build` in backend and frontend locally to confirm builds.
* [ ] Ensure `.env` file exists in `backend/` with DB credentials.
* [ ] Copy `monaco` workers into `frontend/code-battle/public/monaco`.
* [ ] Build & push all Docker images.
* [ ] Create 4 Render services with correct ports.
* [ ] Verify frontend connects to backend/socket/tcr via deployed URLs.

---

Happy deploying 🚀