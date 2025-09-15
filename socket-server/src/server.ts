// socket-server/src/server.ts
import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";

// factories
import { createServices } from "@/factory/service.factory";
import { registerAllHandlers } from "@/factory/handlers.factory";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// initialize services
const services = createServices(io);

// MM matching loop
import { startMatchmakingLoop } from "@/handlers/matchmaking.handler";
startMatchmakingLoop(services);

// socket connection
io.on("connection", (socket) => {
    registerAllHandlers(io, socket, services);
});

server.listen(3001, () => console.log("Socket server running on port 3001"));
