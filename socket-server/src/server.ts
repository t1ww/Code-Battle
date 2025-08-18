// socket-server/src/server.ts
// Import necessary modules and services
import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { ConnectionService } from "@/services/connection.service";
import { MatchmakingService } from "@/services/matchmaking.service";
import { TeamService } from "./services/team.service";
import { TeamInviteService } from "@/services/team.invite.service";
import { PrivateRoomService } from "@/services/privateroom.service";
import { PrivateRoomInviteService } from "@/services/privateRoom.invite.service";

import type {
    MatchMode,
    PlayerSession,
    QueuePlayerData1v1,
    QueuePlayerData3v3,
    Team,
} from "@/types";

// Create an Express app and HTTP server
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

// Initialize services
// NEW: Connection and matchmaking services
const connectionService = new ConnectionService();
const matchmakingService = new MatchmakingService();
// NEW: Private room services
const teamService = new TeamService();
const teamInviteService = new TeamInviteService();
// NEW: Private room services
const privateRoomService = new PrivateRoomService();
const privateRoomInviteService = new PrivateRoomInviteService();

// Helper: Remove socket from players before emitting to clients
function sanitizeTeam(team: Team) {
    return {
        team_id: team.team_id,
        players: team.players.map(({ player_id, name, email }) => ({
            player_id,
            name,
            email,
        })),
    };
}

function sanitizeRoom(room: { room_id: string; team1: Team | null; team2: Team | null }) {
    return {
        room_id: room.room_id,
        team1: room.team1
            ? {
                team_id: room.team1.team_id,
                players: room.team1.players.map(({ player_id, name, email }) => ({
                    player_id,
                    name,
                    email,
                })),
            }
            : undefined,
        team2: room.team2
            ? {
                team_id: room.team2.team_id,
                players: room.team2.players.map(({ player_id, name, email }) => ({
                    player_id,
                    name,
                    email,
                })),
            }
            : undefined,
    };
}


// Matchmaking loop every 6 seconds, tries to start matches for all modes
setInterval(() => {
    (["1v1", "3v3"] as MatchMode[]).forEach((mode) => {
        console.log(`Attempt starting match for ${mode}`);
        matchmakingService.startMatch(mode);
    });
}, 6000);

io.on("connection", (socket) => {
    // Handle new socket connection
    connectionService.handleConnect(socket);

    // Handle socket disconnect
    socket.on("disconnect", () => {
        connectionService.handleDisconnect(socket.id);

        const removed = teamService.removePlayerBySocket(socket);
        if (removed) {
            const { team, playerId } = removed;
            io.to(team.team_id).emit("teamLeft", playerId);

            if (team.players.length === 0) {
                teamService.removeTeam(team.team_id);
            }
        }
    });

    // Create a new team with players attached to current socket
    socket.on("createTeam", (players: PlayerSession[]) => {
        try {
            const playersWithSocket = players.map((p) => ({ ...p, socket }));
            const team = teamService.createTeam(playersWithSocket);
            const inviteId = teamInviteService.createInvite(team.team_id);
            socket.emit("teamCreated", {
                team_id: team.team_id,
                link: `/join/${inviteId}`, // frontend uses this now
            });
            socket.join(team.team_id);
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    // Join an existing team using an invite ID
    socket.on(
        "joinTeamWithInvite",
        ({
            invite_id,
            player,
        }: {
            invite_id: string;
            player: PlayerSession;
        }) => {
            const team_id = teamInviteService.getTeamId(invite_id);

            if (!team_id) {
                socket.emit("error", { error_message: "Invalid or expired invite" });
                return;
            }

            const team = teamService.getTeam(team_id);
            if (!team) {
                socket.emit("error", { error_message: "Team no longer exists" });
                return;
            }

            if (team.players.length >= 3) {
                socket.emit("error", { error_message: "Team is full" });
                return;
            }

            const alreadyJoined = team.players.some(
                (p) => p.player_id === player.player_id
            );
            if (alreadyJoined) {
                socket.emit("error", { error_message: "Player already in team" });
                return;
            }

            team.players.push({ ...player, socket });
            socket.join(team_id);

            io.to(team_id).emit("teamJoined", sanitizeTeam(team));
        }
    );


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

    // Queue an existing team by ID
    socket.on("queueTeam", ({ team_id, mode }: { team_id: string; mode: MatchMode }) => {
        try {
            const team = teamService.getTeam(team_id);
            if (!team) {
                socket.emit("queueResponse", { error_message: "Team not found" });
                return;
            }

            const result = matchmakingService.queueTeam(team);
            if (result.error_message) {
                socket.emit("queueResponse", `Matchmaking error with following message: ${result.error_message}`);
                return;
            }

            socket.emit("queueResponse", result);
        } catch (err) {
            console.error("Error during matchmaking initiation:", err);
            socket.emit("queueResponse", { error_message: "Matchmaking service unavailable. Please try again later." });
        }
    });


    // Start match manually (fallback or test)
    socket.on("startMatch", (data: { mode?: MatchMode }) => {
        const mode = data?.mode || "1v1";
        const result = matchmakingService.startMatch(mode);
        socket.emit("matchResponse", result);
    });

    // ==== PRIVATE ROOM EVENTS ====
    socket.on("createPrivateRoom", (players: PlayerSession[]) => {
        try {
            const room = privateRoomService.createRoom(players);
            const inviteId = privateRoomInviteService.createInvite(room.room_id);

            console.log(`Private room created with ID: ${room.room_id}, Invite ID: ${inviteId}`);

            socket.join(room.room_id);

            // Emit both link and sanitized room to creator
            socket.emit("privateRoomCreated", {
                room_id: room.room_id,
                link: `/privateRoom/${inviteId}`,
                room: sanitizeRoom(room),
            });
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("joinPrivateRoom", ({ inviteId, player }: { inviteId: string, player: PlayerSession }) => {
        try {
            const roomId = privateRoomInviteService.getRoomId(inviteId);
            if (!roomId) throw new Error("Invalid or expired invite");

            // Join as individual player
            const room = privateRoomService.joinRoom(roomId, { ...player, socket });

            socket.join(roomId);
            // Emit sanitized room
            io.to(roomId).emit("privateRoomJoined", {
                room_id: room.room_id,
                link: `/privateRoom/${inviteId}`,
                room: sanitizeRoom(room),
            });
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("swapTeam", ({ room_id, player_id }: { room_id: string; player_id: string }) => {
        try {
            const result = privateRoomService.requestSwap(room_id, player_id);
            if (result.swapped) {
                io.to(room_id).emit("privateRoomUpdated", sanitizeRoom(result.room));
            } else if (result.pending) {
                io.to(room_id).emit("swapRequest", { requesterId: player_id });
            }
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("confirmSwap", ({ room_id, player_id }: { room_id: string; player_id: string }) => {
        try {
            const result = privateRoomService.confirmSwap(room_id, player_id);
            if (result.swapped) {
                io.to(room_id).emit("privateRoomUpdated", sanitizeRoom(result.room));
            }
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("leavePrivateRoom", ({ room_id }: { room_id: string }) => {
        const removed = privateRoomService.removePlayer(socket.id);
        if (removed?.room) {
            io.to(room_id).emit("privateRoomUpdated", sanitizeRoom(removed.room));
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
