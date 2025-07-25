import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { ConnectionService } from "@/services/connection.service";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const connectionService = new ConnectionService();

io.on("connection", (socket) => {
    connectionService.handleConnect(socket);

    socket.on("disconnect", () => {
        connectionService.handleDisconnect(socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
