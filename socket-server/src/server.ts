import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { ConnectionService } from "@/services/connection.service";
import { MatchmakingService } from "@/services/matchmaking.service";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const connectionService = new ConnectionService();
const matchmakingService = new MatchmakingService();

io.on("connection", (socket) => {
    // Connection handling
    connectionService.handleConnect(socket);

    socket.on("disconnect", () => {
        connectionService.handleDisconnect(socket.id);
    });

    // ✅ Matchmaking: Queue a player
    socket.on("queuePlayer", (data) => {
        const result = matchmakingService.queuePlayer({ player_id: data.player_id, socket });
        socket.emit("queueResponse", result);
    });

    // ✅ Matchmaking: Try to start match
    socket.on("startMatch", () => {
        const result = matchmakingService.startMatch();
        socket.emit("matchResponse", result);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
