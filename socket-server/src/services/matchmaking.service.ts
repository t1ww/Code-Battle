// socket-server/src/services/matchmaking.service.ts
import { PlayerSession, Team, MatchMode } from "@/types";
import { Socket } from "socket.io";

export class MatchmakingService {
    private queue1v1: Map<string, PlayerSession> = new Map();
    private queue3v3: Map<string, Team> = new Map();

    // ✅ Type Guards
    private isPlayerSession(input: any): input is PlayerSession {
        return (
            input &&
            typeof input === "object" &&
            typeof input.player_id === "string" &&
            input.socket &&
            typeof input.socket.emit === "function"
        );
    }

    private isTeam(input: any): input is Team {
        return (
            input &&
            typeof input === "object" &&
            typeof input.team_id === "string" &&
            Array.isArray(input.players) &&
            input.players.length === 3 &&
            input.players.every(this.isPlayerSession.bind(this))
        );
    }


    // ✅ UTC-21: queuePlayer for 1v1
    queuePlayer(player: PlayerSession): { message?: string; error_message?: string } {
        // ✅ UTC-21 ID 3: Invalid player object
        if (!this.isPlayerSession(player)) {
            return { error_message: "Invalid player object" };
        }

        // ✅ UTC-21 ID 4: Empty player
        if (!player.player_id || !player.socket) {
            return { error_message: "Player is required" };
        }

        const queue = this.queue1v1;

        // ✅ UTC-21 ID 2: Duplicate player
        if (queue.has(player.player_id)) {
            return { error_message: "Player already in queue" };
        }

        // ✅ UTC-21 ID 1: Valid player added
        queue.set(player.player_id, player);
        return { message: "Player added to 1v1 queue successfully" };
    }

    // ✅ UTC-21: queueTeam for 3v3
    queueTeam(team: Team): { message?: string; error_message?: string } {
        // ✅ UTC-21 ID 3: Invalid team object
        if (!this.isTeam(team)) {
            return { error_message: "Team must consist of exactly 3 valid player sessions" };
        }

        const queue = this.queue3v3;

        // ✅ UTC-21 ID 2: Duplicate team
        if (queue.has(team.team_id)) {
            return { error_message: "Team already in queue" };
        }

        // ✅ Optional: Prevent player duplication across teams
        for (const existingTeam of queue.values()) {
            for (const player of existingTeam.players) {
                if (team.players.some(p => p.player_id === player.player_id)) {
                    return { error_message: `Player ${player.player_id} already in another team queue` };
                }
            }
        }

        // ✅ UTC-21 ID 1: Valid team added
        queue.set(team.team_id, team);
        return { message: "Team added to 3v3 queue successfully" };
    }

    // ✅ UTC-22: startMatch
    startMatch(mode: MatchMode): { message?: string; error_message?: string } {
        if (mode === "1v1") {
            const queue = this.queue1v1;
            const players = Array.from(queue.values());

            // ✅ UTC-22 ID 2: Not enough players
            if (players.length < 2) {
                return { error_message: "Not enough players to start a 1v1 match" };
            }

            // ✅ UTC-22 ID 1: Enough players queued
            const matchPlayers = players.slice(0, 2);
            const [p1, p2] = matchPlayers;

            p1.socket.emit("matchInfo", {
                you: { player_id: p1.player_id, name: p1.name, email: p1.email, token: null },
                friends: [],
                opponents: [{ player_id: p2.player_id, name: p2.name, email: p2.email, token: null }]
            });

            p2.socket.emit("matchInfo", {
                you: { player_id: p2.player_id, name: p2.name, email: p2.email, token: null },
                friends: [],
                opponents: [{ player_id: p1.player_id, name: p1.name, email: p1.email, token: null }]
            });

            matchPlayers.forEach(p => {
                p.socket.emit("matchStarted", { player_id: p.player_id });
                queue.delete(p.player_id);
            });
            // ✅ Emit match started event
            return { message: "1v1 match started successfully" };
        }

        const queue = this.queue3v3;
        const teams = Array.from(queue.values());

        // ✅ UTC-22 ID 2: Not enough teams
        if (teams.length < 2) {
            return { error_message: "Not enough teams to start a 3v3 match" };
        }

        // ✅ UTC-22 ID 1: Enough teams queued
        const [teamA, teamB] = teams.slice(0, 2);

        const teamAData = teamA.players.map(p => ({
            player_id: p.player_id,
            name: p.name,
            email: p.email,
            token: null
        }));
        const teamBData = teamB.players.map(p => ({
            player_id: p.player_id,
            name: p.name,
            email: p.email,
            token: null
        }));

        teamA.players.forEach(p => {
            p.socket.emit("matchInfo", {
                you: { player_id: p.player_id, name: p.name, email: p.email, token: null },
                friends: teamAData.filter(fp => fp.player_id !== p.player_id),
                opponents: teamBData
            });

            p.socket.emit("matchStarted", {
                player_id: p.player_id,
                team_id: teamA.team_id
            });
        });

        teamB.players.forEach(p => {
            p.socket.emit("matchInfo", {
                you: { player_id: p.player_id, name: p.name, email: p.email, token: null },
                friends: teamBData.filter(fp => fp.player_id !== p.player_id),
                opponents: teamAData
            });

            p.socket.emit("matchStarted", {
                player_id: p.player_id,
                team_id: teamB.team_id
            });
        });

        queue.delete(teamA.team_id);
        queue.delete(teamB.team_id);

        return { message: "3v3 match started successfully" };
    }
}
