// services/privateroom.service.ts
import { v4 as uuidv4 } from "uuid";
import type { PlayerSession, Team } from "@/types";

interface PrivateRoom {
    room_id: string;
    team1: Team | null;
    team2: Team | null;
    pendingSwap?: {
        requesterId: string;
        targetTeam: "team1" | "team2";
    };
}

export class PrivateRoomService {
    private rooms: Map<string, PrivateRoom> = new Map();

    /** Create a private room with team1 already set */
    createRoom(initialPlayers: PlayerSession[]): PrivateRoom {
        if (initialPlayers.length < 1 || initialPlayers.length > 3) {
            throw new Error("Team must have between 1 and 3 players");
        }

        const team1: Team = {
            team_id: uuidv4(),
            players: initialPlayers,
        };

        const room: PrivateRoom = {
            room_id: uuidv4(),
            team1,
            team2: null,
        };

        this.rooms.set(room.room_id, room);
        return room;
    }

    /** Join as team2 */
    joinRoom(room_id: string, players: PlayerSession[]): PrivateRoom {
        const room = this.rooms.get(room_id);
        if (!room) throw new Error("Room not found");
        if (room.team2) throw new Error("Room already has two teams");

        if (players.length < 1 || players.length > 3) {
            throw new Error("Team must have between 1 and 3 players");
        }

        const team2: Team = {
            team_id: uuidv4(),
            players,
        };

        room.team2 = team2;
        return room;
    }

    /** Request or perform swap */
    requestSwap(room_id: string, player_id: string) {
        const room = this.rooms.get(room_id);
        if (!room?.team1 || !room.team2) throw new Error("Room must have two teams to swap");

        const isInTeam1 = room.team1.players.some(p => p.player_id === player_id);
        const fromTeam = isInTeam1 ? room.team1 : room.team2;
        const toTeam = isInTeam1 ? room.team2 : room.team1;
        const targetTeamKey = isInTeam1 ? "team2" : "team1";

        if (!fromTeam || !toTeam) throw new Error("Teams not set properly");

        if (toTeam.players.length < 3) {
            // Direct move
            const player = fromTeam.players.find(p => p.player_id === player_id)!;
            fromTeam.players = fromTeam.players.filter(p => p.player_id !== player_id);
            toTeam.players.push(player);
            room.pendingSwap = undefined;
            return { swapped: true, room };
        }

        // Both full → store pending swap
        room.pendingSwap = {
            requesterId: player_id,
            targetTeam: targetTeamKey,
        };
        return { swapped: false, pending: true, room };
    }

    /** Confirm swap */
    confirmSwap(room_id: string, player_id: string) {
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

        requesterTeamObj.players = requesterTeamObj.players.filter(p => p.player_id !== requesterId);
        targetTeamObj.players = targetTeamObj.players.filter(p => p.player_id !== player_id);

        requesterTeamObj.players.push(confirmer);
        targetTeamObj.players.push(requester);

        room.pendingSwap = undefined;

        return { swapped: true, room };
    }

    /** Get room */
    getRoom(room_id: string): PrivateRoom | undefined {
        return this.rooms.get(room_id);
    }

    /** Remove player by socket */
    removePlayer(socketId: string): { room?: PrivateRoom; teamKey?: "team1" | "team2"; playerId?: string } | undefined {
        for (const [room_id, room] of this.rooms) {
            for (const teamKey of ["team1", "team2"] as const) {
                const team = room[teamKey];
                if (!team) continue;

                const idx = team.players.findIndex((p) => p.socket.id === socketId);
                if (idx !== -1) {
                    const [removedPlayer] = team.players.splice(idx, 1);

                    // If both teams empty → delete room
                    if ((!room.team1 || room.team1.players.length === 0) &&
                        (!room.team2 || room.team2.players.length === 0)) {
                        this.rooms.delete(room_id);
                    }
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
