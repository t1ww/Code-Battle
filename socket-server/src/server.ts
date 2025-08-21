// socket-server/src/server.ts
// Import necessary modules and services
import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { ConnectionService } from "@/services/connection.service";
import { MatchmakingService } from "@/services/matchmaking.service";
import { TeamService } from "@/services/team.service";
import { TeamInviteService } from "@/services/team.invite.service";
import { PrivateRoomService } from "@/services/privateRoom.service";
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

function sanitizeRoomForUpdate(room: { team1: Team | null; team2: Team | null }) {
    return {
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

// Matchmaking loop every 6 seconds, tries to start matches for all modes by alternating
let alternate = true;
setInterval(() => {
    if (alternate) {
        console.log(`Attempt starting match for ${"1v1"}`);
        matchmakingService.startMatch("1v1");
    } else {
        console.log(`Attempt starting match for ${"3v3"}`);
        matchmakingService.startMatch("3v3");
    }
    alternate = !alternate;
}, 6000);

io.on("connection", (socket) => {
    // Handle new socket connection
    connectionService.handleConnect(socket);

    // ==== CONNECTION EVENTS ====
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

    // ==== TEAM FORMATION EVENTS ====
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


    // Start match manually (fallback or test)
    socket.on("startMatch", (data: { mode?: MatchMode }) => {
        const mode = data?.mode || "1v1";
        const result = matchmakingService.startMatch(mode);
        socket.emit("matchResponse", result);
    });

    // ==== PRIVATE ROOM EVENTS ====
    socket.on("createPrivateRoom", (player: PlayerSession) => {
        try {
            // Attach the socket before passing to the service
            const playerWithSocket = { ...player, socket };

            const room = privateRoomService.createRoom(playerWithSocket);
            const inviteId = privateRoomInviteService.createInvite(room.room_id);

            console.log(`Private room created with ID: ${room.room_id}, Invite ID: ${inviteId}, by ${socket.id}: ${player.name}`);

            socket.join(room.room_id);

            const sanitizedRoom = sanitizeRoom(room);
            socket.emit("privateRoomCreated", {
                ...sanitizedRoom,
                inviteLink: `/privateRoom/${inviteId}`,
            });
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("joinPrivateRoom", ({ inviteId, player }: { inviteId: string, player: PlayerSession }) => {
        try {
            const roomId = privateRoomInviteService.getRoomId(inviteId);
            if (!roomId) throw new Error("Invalid or expired invite");

            const room = privateRoomService.joinRoom(roomId, { ...player, socket });

            socket.join(roomId);
            const sanitizedRoom = sanitizeRoom(room);
            const sanitizedRoomForUpdate = sanitizeRoomForUpdate(room);
            console.log(`Player ${player.name} joined private room: ${roomId}`);

            // Send full snapshot only to the joiner
            socket.emit("privateRoomJoined", {
                ...sanitizedRoom,
                inviteLink: `/privateRoom/${inviteId}`,
            });

            // Notify everyone else already in the room (socket.to instead of io.to to avoid sending to the joiner)
            socket.to(roomId).emit("privateRoomUpdated", sanitizedRoomForUpdate);
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("swapTeam", ({ room_id, player_id }: { room_id: string; player_id: string }) => {
        try {
            const result = privateRoomService.requestSwap(room_id, player_id);
            if (result.swapped) {
                io.to(room_id).emit("privateRoomUpdated", sanitizeRoomForUpdate(result.room));
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
                io.to(room_id).emit("privateRoomUpdated", sanitizeRoomForUpdate(result.room));
            }
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("leavePrivateRoom", () => {
        const removed = privateRoomService.removePlayer(socket.id);
        if (!removed?.room) return;

        const room = removed.room;

        // Cancel pending swap if this player was involved
        const cancelled = privateRoomService.cancelPendingSwap(room.room_id, removed.playerId);
        if (cancelled) {
            io.to(room.room_id).emit("swapCancelled", { cancelledBy: removed.playerId });
        }

        // Notify remaining players in the room or delete the room if the player left was the creator
        if (removed.playerId === room.creatorId) {
            console.log(`Room ${room.room_id} deleted by creator ${removed.playerId}`);
            privateRoomService.deleteRoom(room.room_id);
            io.to(room.room_id).emit("privateRoomDeleted");
        } else {
            console.log(`Player ${removed.playerId} left room ${room.room_id}`);
            io.to(room.room_id).emit("privateRoomUpdated", sanitizeRoomForUpdate(room));
        }
    });

    socket.on("cancelPendingSwap", ({ room_id, player_id }: { room_id: string; player_id: string }) => {
        try {
            const cancelled = privateRoomService.cancelPendingSwap(room_id, player_id);
            if (cancelled) {
                io.to(room_id).emit("swapCancelled", { cancelledBy: player_id });
            } else {
                socket.emit("error", { error_message: "No pending swap to cancel" });
            }
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
