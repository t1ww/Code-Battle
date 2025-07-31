import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { ConnectionService } from "@/services/connection.service";
import { MatchmakingService } from "@/services/matchmaking.service";
import { MatchMode, QueuedPlayer, QueuePlayerData, QueuePlayerData1v1, QueuePlayerData3v3, Team } from "@/types";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const connectionService = new ConnectionService();
const matchmakingService = new MatchmakingService();

// Start match (matching) loop
setInterval(() => {
    ['1v1', '3v3'].forEach(mode => {
        console.log(`Attempt starting match for ${mode}`)
        matchmakingService.startMatch(mode as MatchMode);
    });
}, 2000);

io.on("connection", (socket) => {
    // Connection handling
    connectionService.handleConnect(socket);

    socket.on("disconnect", () => {
        connectionService.handleDisconnect(socket.id);
    });

    // ✅ Matchmaking: Queue a player
    socket.on("queuePlayer", (data: QueuePlayerData) => {
        const mode = data.mode || "1v1";

        if (mode === "1v1" && "player_id" in data) {
            const playerData = data as QueuePlayerData1v1;
            console.log(`Queuing player for 1v1: ${playerData.name}`)
            const player: QueuedPlayer = {
                player_id: playerData.player_id,
                name: playerData.name,
                email: playerData.email,
                socket,
            };

            const result = matchmakingService.queuePlayer(player, mode);
            socket.emit("queueResponse", result);
        } else if (mode === "3v3" && "team_id" in data && Array.isArray(data.players)) {
            // Cast data to QueuePlayerData3v3
            const teamData = data as QueuePlayerData3v3;

            const team: Team = {
                team_id: teamData.team_id,
                players: teamData.players.map(p => ({
                    player_id: p.player_id,
                    name: p.name,
                    email: p.email,
                    socket,
                })),
            };

            const result = matchmakingService.queuePlayer(team, mode);
            socket.emit("queueResponse", result);
        }
    });

    // ✅ Matchmaking: Try to start match
    socket.on("startMatch", (data: { mode?: MatchMode }) => {
        const mode = data?.mode || "1v1"; // default to 1v1 if no mode sent
        const result = matchmakingService.startMatch(mode);
        socket.emit("matchResponse", result);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
