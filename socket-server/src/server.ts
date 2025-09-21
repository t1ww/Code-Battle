// socket-server/src/server.ts
import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// factories
import { createServices } from "@/factory/service.factory";
import { registerAllHandlers } from "@/factory/handlers.factory";

// initialize services
const services = createServices(io);

// MM matching loop
import { startMatchmakingLoop } from "@/handlers/matchmaking.handler";
startMatchmakingLoop(services);

// socket connection
io.on("connection", (socket) => {
  registerAllHandlers(io, socket, services);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Socket server running on port ${PORT}`));
