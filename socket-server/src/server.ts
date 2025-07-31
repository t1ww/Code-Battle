import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { ConnectionService } from "@/services/connection.service";
import { MatchmakingService } from "@/services/matchmaking.service";
import { Team } from "@/types";

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
        const mode = data.mode || "1v1";

        if (mode === "1v1") {
            const result = matchmakingService.queuePlayer({ player_id: data.player_id, socket }, mode);
            socket.emit("queueResponse", result);
        } else if (mode === "3v3") {
            const team: Team = {
                team_id: data.team_id,
                players: data.players.map((p: { player_id: string }) => ({
                    player_id: p.player_id,
                    socket
                }))
            };
            const result = matchmakingService.queuePlayer(team, mode);
            socket.emit("queueResponse", result);
        }
    });


    // ✅ Matchmaking: Try to start match
    socket.on("startMatch", (data) => {
        const mode = data?.mode || "1v1"; // default to 1v1 if no mode sent
        const result = matchmakingService.startMatch(mode);
        socket.emit("matchResponse", result);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
