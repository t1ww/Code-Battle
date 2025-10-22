// socket-server/src/handlers/privateRoom.handler.ts
import type { Server, Socket } from "socket.io";
import type { PlayerSession } from "@/types";
import { sanitizeRoom, sanitizeRoomForUpdate } from "@/utils/sanitize";

export function registerPrivateRoomHandlers(io: Server, socket: Socket, services: any) {
    const { privateRoomService, privateRoomInviteService } = services;

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

    socket.on("startPrivateRoomGame", ({ room_id, player_id }: { room_id: string; player_id: string }) => {
        try {
            const room = privateRoomService.getRoom(room_id);
            if (!room) {
                socket.emit("error", { error_message: "Room not found" });
                return;
            }

            // Only room creator can start
            if (room.creatorId !== player_id) {
                socket.emit("error", { error_message: "Only the room creator can start the game" });
                return;
            }

            const team1Count = room.team1.players.length;
            const team2Count = room.team2.players.length;

            // Allow start only for 1v1 or 3v3 setups
            const is1v1 = team1Count === 1 && team2Count === 1;
            const is3v3 = team1Count === 3 && team2Count === 3;

            if (!is1v1 && !is3v3) {
                socket.emit("error", { error_message: "Game can only start in 1v1 or 3v3 mode" });
                return;
            }

            io.to(room_id).emit("privateRoomCountdown", { countdown: 5000 });

            setTimeout(() => {
                privateRoomService.startGame(room_id);
            }, 5000);
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    socket.on("swapTeam", ({ room_id, player_id }: { room_id: string; player_id: string }) => {
        try {
            const result = privateRoomService.requestSwap(room_id, player_id, socket);

            if (!result.swapped && result.pending === "alreadyPending") {
                console.log(`Swap request by ${player_id} in room ${room_id} failed: swap already pending`);
            }

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
}
