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
const matchmakingService = new MatchmakingService(io);
// NEW: Team services
const teamService = new TeamService();
const teamInviteService = new TeamInviteService();
// NEW: Private room services
const privateRoomService = new PrivateRoomService(io);
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

function disbandTeam(team: Team) {
    // Notify remaining player (if any) that team is disbanded
    io.to(team.team_id).emit("teamDisbanded");
    // Make all players leave the socket room
    team.players.forEach(p => p.socket.leave(team.team_id));
    // Remove the team from the service
    console.log(`Disbanding team ${team.team_id} with players: ${team.players.map(p => p.name).join(", ")}`);
    teamService.removeTeam(team.team_id);
}

// Matchmaking loop every 6 seconds, tries to start matches for all modes by alternating
let alternate = true;
setInterval(() => {
    if (alternate) {
        console.log(`Attempt starting match for ${"1v1"}`);
        matchmakingService.startMatch1v1();
    } else {
        console.log(`Attempt starting match for ${"3v3"}`);
        matchmakingService.startMatch3v3();
    }
    alternate = !alternate;
}, 6000);

io.on("connection", (socket) => {
    // Handle new socket connection
    connectionService.handleConnect(socket);

    // ==== CONNECTION EVENTS ====
    // Attach player info to the socket
    socket.on("sendsPlayerInfo", (player) => {
        // Attach the socket to the player session
        socket.data.player = { ...player, socket };
        console.log(`Player connected: ${player.name} (${socket.id})`);
    });

    // Handle socket disconnect
    socket.on("disconnect", () => {
        connectionService.handleDisconnect(socket.id);

        const removedPlayer = socket.data.player as PlayerSession;
        if (!removedPlayer) return;

        // Cancel 1v1 queue if needed
        matchmakingService.cancelPlayerQueue(removedPlayer.player_id);

        // Get the team the player belongs to
        const team = teamService.getTeamBySocket(socket) as (Team & { leaderId: string }) | undefined;

        // Cancel team queue first
        if (team) {
            matchmakingService.cancelTeamQueue(team.team_id);
            io.to(team.team_id).emit("teamQueueCanceled", { canceledBy: socket.data.player.name });
        }
        // If the player is a leader, disband the team
        if (team && removedPlayer.player_id === team.leaderId) {
            disbandTeam(team);
        } else if (team) {
            // Otherwise, just remove the player
            const removedTeam = teamService.removePlayerBySocket(socket);
            if (removedTeam) {
                const { team, playerId } = removedTeam;
                socket.leave(team.team_id);
                io.to(team.team_id).emit("teamLeft", playerId);

                // If the team now has ≤1 player, disband it anyway
                if (team.players.length <= 1) {
                    disbandTeam(team);
                }
            }
        }

        // Handle private room cleanup
        const removedRoom = privateRoomService.removePlayer(socket.id);
        if (removedRoom?.room) {
            const room = removedRoom.room;
            // Leave the room and teams
            socket.leave(room.room_id);
            socket.leave(`${room.room_id}-team1`);
            socket.leave(`${room.room_id}-team2`);

            // Cancel any pending swap requests involving this player
            const cancelled = privateRoomService.cancelPendingSwap(room.room_id, removedRoom.playerId);
            if (cancelled) {
                io.to(room.room_id).emit("swapCancelled", { cancelledBy: removedRoom.playerId });
                io.to(room.room_id).emit("swapClear"); // clear UI for everyone
            }

            // If the player was the room creator, delete the room
            if (removedRoom.playerId === room.creatorId) {
                privateRoomService.deleteRoom(room.room_id);
                io.to(room.room_id).emit("privateRoomDeleted");
            } else {
                io.to(room.room_id).emit("privateRoomUpdated", sanitizeRoomForUpdate(room));
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

    // MATCHMAKING & QUEUE EVENTS
    const TIMEOUT_MESSAGE = "No suitable match found. You can re-queue if you wish. Or try bring some friends C:";
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

                const result = matchmakingService.queuePlayer(player, (player) => {
                    player.socket.emit("queueTimeout", { message: TIMEOUT_MESSAGE });
                });
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

            const result = matchmakingService.queueTeam(team, (team) => {
                io.to(team.team_id).emit("queueTimeout", { message: TIMEOUT_MESSAGE });
            });
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


    // ==== PRIVATE ROOM EVENTS ====
    socket.on("createPrivateRoom", (player: PlayerSession) => {
        try {
            // Attach the socket before passing to the service
            const playerWithSocket = { ...player, socket };

            const room = privateRoomService.createRoom(playerWithSocket);
            const inviteId = privateRoomInviteService.createInvite(room.room_id);

            console.log(`Private room created with ID: ${room.room_id}, Invite ID: ${inviteId}, by ${socket.id}: ${player.name}`);

            // Join the socket to the private room and team1
            socket.join(room.room_id);
            socket.join(`${room.room_id}-team1`);

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

            const { room, enteredTeam } = privateRoomService.joinRoom(roomId, { ...player, socket });

            // Join the socket to the private room and entered team
            socket.join(roomId);
            socket.join(`${roomId}-${enteredTeam}`);

            // Sanitize the room data before sending
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
            const result = privateRoomService.requestSwap(
                room_id,
                player_id,
                socket
            );

            if (result.swapped) {
                // Determine old and new team
                const newTeam = privateRoomService.getPlayerTeam(room_id, player_id); // after swap
                if (!newTeam) throw new Error(`Cannot determine new team for player ${player_id} in room ${room_id}`);
                const oldTeam = newTeam === "team1" ? "team2" : "team1";

                // Move socket to new team room
                socket.leave(`${room_id}-${oldTeam}`);
                socket.join(`${room_id}-${newTeam}`);
                // Broadcast updated room state to everyone
                io.to(room_id).emit("privateRoomUpdated", sanitizeRoomForUpdate(result.room));
            } else if (result.pending) {
                const currentTeam = privateRoomService.getPlayerTeam(room_id, player_id);
                if (!currentTeam) throw new Error("Could not determine requester’s team");

                const targetTeam = currentTeam === "team1" ? "team2" : "team1";
                console.log(`Swap requested by ${player_id} (from ${currentTeam}) in room ${room_id}`);

                // Notify the target team for swap request
                io.to(`${room_id}-${targetTeam}`).emit("swapRequestByOpponent", { requesterId: player_id });
                // Notify the teammate that request was sent and they can't request again
                socket.to(`${room_id}-${currentTeam}`).emit("swapRequestByTeammate", { requesterId: player_id });
                // Notify the requester that their request was sent and Send to requester timer info
                const totalTime = 15000; // match the timeout in requestSwap
                socket.emit("swapRequestByme", { requesterId: player_id, swapTime: totalTime });
            }
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("confirmSwap", ({ room_id, player_id, requester_id }: { room_id: string; player_id: string; requester_id: string }) => {
        try {
            const requesterSocket = privateRoomService.getRoom(room_id)?.pendingSwap?.requesterSocket;
            const result = privateRoomService.confirmSwap(room_id, player_id);

            if (result.swapped) {
                const newTeam = privateRoomService.getPlayerTeam(room_id, player_id); // new team
                if (!newTeam) throw new Error(`Cannot determine new team for player ${player_id} in room ${room_id}`);
                const oldTeam = newTeam === "team1" ? "team2" : "team1";

                // Move socket of confirmer to new team room
                console.log(`Swap confirmed by ${player_id} (from ${oldTeam}) in room ${room_id}`);
                socket.leave(`${room_id}-${oldTeam}`);
                socket.join(`${room_id}-${newTeam}`);

                // Move socket of requester to old team room
                if (!requesterSocket) throw new Error(`Requester socket not found for requester_id ${requester_id} in room ${room_id}`);
                console.log(`Swapped with requester: ${requester_id} (from ${newTeam}) in room ${room_id}`);
                requesterSocket.leave(`${room_id}-${newTeam}`);
                requesterSocket.join(`${room_id}-${oldTeam}`);

                // Notify all clients with updated room state
                io.to(room_id).emit("privateRoomUpdated", sanitizeRoomForUpdate(result.room));
                // Notify the everyone to clear swap UI
                io.to(`${room_id}`).emit('swapClear');
            }
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("rejectSwap", ({ room_id, player_id }) => {
        const result = privateRoomService.rejectSwap(room_id, player_id);

        if (!result) {
            socket.emit("rejectSwapFailed", { reason: "No pending swap or team not full yet" });
        }
    });


    socket.on("leavePrivateRoom", () => {
        const removed = privateRoomService.removePlayer(socket.id);
        if (!removed?.room) return;

        const room = removed.room;
        // Leave the room and teams
        socket.leave(room.room_id);
        socket.leave(`${room.room_id}-team1`);
        socket.leave(`${room.room_id}-team2`);

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
