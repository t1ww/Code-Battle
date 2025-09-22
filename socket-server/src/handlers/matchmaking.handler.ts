// socket-server/src/handlers/matchmaking.handler.ts
import type { Server, Socket } from "socket.io";
import type { PlayerSession, QueuePlayerData1v1, QueuePlayerData3v3, Services } from "@/types";

export function registerMatchmakingHandlers(io: Server, socket: Socket, services: Services) {
    const { matchmakingService, teamService } = services;

    // MATCHMAKING & QUEUE EVENTS
    // ==== 1v1 MATCHMAKING EVENTS ====
    // Queue a player or team for matchmaking
    socket.on("queuePlayer", (data: QueuePlayerData1v1) => {
        try {
            if ("player" in data) {
                const playerData = data.player;
                console.log(`Queuing player for 1v1: ${playerData.name}`);

                const player: PlayerSession = {
                    ...playerData,
                    socket,
                };

                const result = matchmakingService.queuePlayer(player);
                if (result.error_message) {
                    socket.emit("queueResponse", `Matchmaking error with following message: ${result.error_message}`);
                    return;
                }

                socket.emit("queueResponse", result);
            } else {
                socket.emit("queueResponse", { error_message: "Invalid queue data" });
            }
        } catch (err) {
            console.error("Error during matchmaking initiation:", err);
            socket.emit("queueResponse", { error_message: "Matchmaking service unavailable. Please try again later." });
        }
    });
    // Cancel a player's queue
    socket.on("cancelQueue", () => {
        // Handle 1v1 removal
        const removedPlayer = socket.data.player as PlayerSession;
        if (!removedPlayer) return;

        // Cancel the player's matchmaking queue
        matchmakingService.cancelPlayerQueue(removedPlayer.player_id);
        // Notify the player that the queue was canceled
        socket.emit("playerQueueCanceled");
    });

    // ==== 3v3 TEAM QUEUE EVENTS ====
    // Queue an existing team by ID
    socket.on("queueTeam", (data: QueuePlayerData3v3) => {
        try {
            const team = teamService.getTeam(data.team_id);
            if (!team) {
                socket.emit("queueResponse", { error_message: "Team not found" });
                return;
            }

            const result = matchmakingService.queueTeam(team);
            if (result.error_message) {
                socket.emit("queueResponse", `Matchmaking error with following message: ${result.error_message}`);
                return;
            }
            // Bring team members to matchmaking page
            socket.to(data.team_id).emit("teamMembersJoinMatchmaking", data.timeLimit);
            // Successful queue
            io.to(data.team_id).emit("queueResponse", result);
        } catch (err) {
            console.error("Error during matchmaking initiation:", err);
            io.to(data.team_id).emit("queueResponse", { error_message: "Matchmaking service unavailable. Please try again later." });
        }
    });
    // Cancel team's queue
    socket.on("cancelQueueTeam", () => {
        const team = teamService.getTeamBySocket(socket);
        if (!team) return;
        // Cancel the team's matchmaking queue
        matchmakingService.cancelTeamQueue(team.team_id);

        // Notify all team members that the queue was canceled  
        console.log(`Team queue canceled for team ${team.team_id} by ${socket.data.player?.name || socket.id}`);
        io.to(team.team_id).emit("teamQueueCanceled", { canceledBy: socket.data.player.name });
    });
}
// Start global matchmaking loop
export function startMatchmakingLoop(services: Services) {
    const { matchmakingService } = services;

    let alternate = true;
    setInterval(() => {
        if (alternate) {
            console.log(`Attempt starting match for 1v1`);
            matchmakingService.startMatch1v1();
        } else {
            console.log(`Attempt starting match for 3v3`);
            matchmakingService.startMatch3v3();
        }
        alternate = !alternate;
    }, 3000);
}