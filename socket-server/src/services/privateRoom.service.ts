// socket-server/src/services/privateroom.service.ts
import { v4 as uuidv4 } from "uuid";
import type { PlayerSession, Team } from "@/types";
import { Socket } from "socket.io";

// PlayerSession includes a Socket, but service should only handle player data.
// Consider using a type like PlayerData without the socket.
interface PrivateRoom {
    room_id: string;
    team1: Team;
    team2: Team;
    creatorId: string; // add creator tracking
    pendingSwap?: {
        requesterId: string;
        requesterSocket: Socket;
        targetTeam: "team1" | "team2";
        timeoutId?: NodeJS.Timeout;
    };
}

export class PrivateRoomService {
    private rooms: Map<string, PrivateRoom> = new Map();

    /** Create a private room with team1 already set */
    createRoom(initialPlayer: PlayerSession): PrivateRoom {
        const team1: Team = { team_id: uuidv4(), players: [initialPlayer] };
        const team2: Team = { team_id: uuidv4(), players: [] };
        const room: PrivateRoom = {
            room_id: uuidv4(),
            team1,
            team2,
            creatorId: initialPlayer.player_id,
        };
        this.rooms.set(room.room_id, room);
        return room;
    }

    /** Join a player, automatically choosing team with fewer members */
    joinRoom(room_id: string, player: PlayerSession): { room: PrivateRoom; enteredTeam: "team1" | "team2" } {
        const room = this.rooms.get(room_id);
        if (!room) throw new Error("Room not found");

        // Decide which team to join (team with fewer players, default team1)
        const targetTeam = room.team1.players.length <= room.team2.players.length ? room.team1 : room.team2;

        if (targetTeam.players.length >= 3) {
            throw new Error("Both teams are full");
        }

        targetTeam.players.push(player);
        return { room, enteredTeam: targetTeam === room.team1 ? "team1" : "team2" };
    }

    /** Get which team a player is on */
    getPlayerTeam(room_id: string, player_id: string): "team1" | "team2" | null {
        const room = this.rooms.get(room_id);
        if (!room) throw new Error("Room not found");

        if (room.team1.players.some(p => p.player_id === player_id)) {
            return "team1";
        }
        if (room.team2.players.some(p => p.player_id === player_id)) {
            return "team2";
        }
        return null; // not in the room
    }

    /** Get both teams from a room */
    getTeams(room_id: string): { team1: Team; team2: Team } {
        const room = this.rooms.get(room_id);
        if (!room) throw new Error("Room not found");
        if (!room.team1 || !room.team2) throw new Error("Both teams must be set");
        return { team1: room.team1, team2: room.team2 };
    }

    /** Request or perform swap */
    requestSwap(
        room_id: string,
        player_id: string,
        requesterSocket: Socket,
        onExpire: (room: PrivateRoom, by: string) => void
    ) {
        const room = this.rooms.get(room_id);
        if (!room?.team1 || !room.team2) throw new Error("Room must have two teams to swap");

        const isInTeam1 = room.team1.players.some(p => p.player_id === player_id);
        const fromTeam = isInTeam1 ? room.team1 : room.team2;
        const toTeam = isInTeam1 ? room.team2 : room.team1;
        const targetTeamKey = isInTeam1 ? "team2" : "team1";

        if (!fromTeam || !toTeam) throw new Error("Teams not set properly");

        // If target team has space, swap immediately
        if (toTeam.players.length < 3) {
            const player = fromTeam.players.find(p => p.player_id === player_id)!;
            fromTeam.players = fromTeam.players.filter(p => p.player_id !== player_id);
            toTeam.players.push(player);
            room.pendingSwap = undefined;
            return { swapped: true, room };
        }

        // If a swap is already pending, reject this request
        if (room.pendingSwap) {
            return { swapped: false, pending: "alreadyPending", room };
        }

        // Both teams full → store pending swap with auto-expire
        const timeoutId = setTimeout(() => {
            if (room.pendingSwap?.requesterId === player_id) {
                this.cancelPendingSwap(room.room_id, player_id);
                onExpire(room, player_id);
            }
        }, 15000);

        room.pendingSwap = {
            requesterId: player_id,
            requesterSocket,
            targetTeam: targetTeamKey,
            timeoutId,
        };

        return { swapped: false, pending: true, room };
    }

    /** Confirm swap */
    confirmSwap(room_id: string, player_id: string, confirmerSocket: Socket) {
        const room = this.rooms.get(room_id);
        if (!room?.team1 || !room.team2) throw new Error("Room not found or incomplete");
        if (!room.pendingSwap) throw new Error("No pending swap request");

        const { requesterId, targetTeam } = room.pendingSwap;
        const targetTeamObj = targetTeam === "team1" ? room.team1 : room.team2;
        const oppositeTeamObj = targetTeam === "team1" ? room.team2 : room.team1;

        if (!targetTeamObj.players.some(p => p.player_id === player_id)) {
            throw new Error("You are not in the target team for this swap");
        }

        const requesterTeamObj = oppositeTeamObj;
        const requester = requesterTeamObj.players.find(p => p.player_id === requesterId)!;
        const confirmer = targetTeamObj.players.find(p => p.player_id === player_id)!;

        // Remove both players from their current teams
        requesterTeamObj.players = requesterTeamObj.players.filter(p => p.player_id !== requesterId);
        targetTeamObj.players = targetTeamObj.players.filter(p => p.player_id !== player_id);

        // Add them to each other's teams
        requesterTeamObj.players.push(confirmer);
        targetTeamObj.players.push(requester);

        // Clear pending swap and timeout
        if (room.pendingSwap?.timeoutId) {
            clearTimeout(room.pendingSwap.timeoutId);
        }
        room.pendingSwap = undefined;

        return { swapped: true, room };
    }

    cancelPendingSwap(room_id: string, player_id: string): boolean {
        const room = this.rooms.get(room_id);
        if (!room || !room.pendingSwap) return false;

        const { requesterId, targetTeam } = room.pendingSwap;

        // Cancel if the player was either requester or in the target team
        if (requesterId === player_id) {
            // Clear pending swap and timeout
            if (room.pendingSwap?.timeoutId) {
                clearTimeout(room.pendingSwap.timeoutId);
            }
            room.pendingSwap = undefined;
            return true;
        }

        const targetTeamObj = targetTeam === "team1" ? room.team1 : room.team2;
        if (targetTeamObj.players.some(p => p.player_id === player_id)) {
            // Clear pending swap and timeout
            if (room.pendingSwap?.timeoutId) {
                clearTimeout(room.pendingSwap.timeoutId);
            }
            room.pendingSwap = undefined;
            return true;
        }

        return false;
    }

    /** Get room */
    getRoom(room_id: string): PrivateRoom | undefined {
        return this.rooms.get(room_id);
    }

    /** Remove player by socket */
    removePlayer(socketId: string): { room: PrivateRoom; teamKey: "team1" | "team2"; playerId: string } | undefined {
        for (const [roomId, room] of this.rooms) {
            for (const teamKey of ["team1", "team2"] as const) {
                const team = room[teamKey];
                if (!team) continue;

                const idx = team.players.findIndex(p => p.socket.id === socketId);
                if (idx !== -1) {
                    const [removedPlayer] = team.players.splice(idx, 1);

                    // Note: don't delete the room here, server handles it separately
                    return { room, teamKey, playerId: removedPlayer.player_id };
                }
            }
        }
        return undefined;
    }

    /** Delete room entirely */
    deleteRoom(room_id: string) {
        this.rooms.delete(room_id);
    }
}
