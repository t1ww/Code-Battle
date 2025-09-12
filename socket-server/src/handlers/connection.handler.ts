// socket-server/src/handlers/connection.handler.ts
import type { Server, Socket } from "socket.io";
import type { PlayerSession, Team } from "@/types";
import { sanitizeRoomForUpdate } from "@/utils/sanitize";


export function registerConnectionHandlers(io: Server, socket: Socket, services: any) {
    const { connectionService, matchmakingService, teamService, privateRoomService } = services;
    
    // Helper
    function disbandTeam(team: Team) {
        // Notify remaining player (if any) that team is disbanded
        io.to(team.team_id).emit("teamDisbanded");
        // Make all players leave the socket room
        team.players.forEach(p => p.socket.leave(team.team_id));
        // Remove the team from the service
        console.log(`Disbanding team ${team.team_id} with players: ${team.players.map(p => p.name).join(", ")}`);
        teamService.removeTeam(team.team_id);
    }

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
}
