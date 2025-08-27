// socket-server/src/services/matchmaking.service.ts
import { PlayerSession, Team } from "@/types";

const MAX_QUEUE_TIME_MS = 30_000; // 60 seconds
// ✅ SRS-086: The system shall pair players or teams based on matchmaking criteria including player connection quality and wait time.
// Helper to measure connection quality (simple heuristic)
function measureConnectionQuality(player: PlayerSession): number {
    // simple heuristic: 100 - latency (clamped 0–100)
    const latency = (player.socket.conn as any)?.ping ?? 50; // fallback 50ms
    return Math.max(0, Math.min(100, 100 - latency));
}
// Simple matchmaking score combining wait time and connection quality
function matchmakingScore(player: PlayerSession) {
    const waitTime = Date.now() - (player.joinedQueueAt ?? Date.now());
    const connection = player.connectionQuality ?? 50;
    // Give some weight to wait time vs connection quality
    return waitTime * 0.7 + connection * 0.3;
}
function teamScore(team: Team) {
    return team.players.reduce((sum, p) => sum + matchmakingScore(p), 0) / team.players.length;
}

// Matchmaking Service class
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
    queuePlayer(player: PlayerSession, onExpire: (player: PlayerSession) => void): { message?: string; error_message?: string } {
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

        // ✅ SRS-086: The system shall pair players or teams based on matchmaking criteria including player connection quality and wait time.
        player.connectionQuality = measureConnectionQuality(player); // custom fn or heuristic
        player.joinedQueueAt = Date.now();

        // ✅ SRS-091: If no suitable match is found within a timeout period, the system shall cancel matchmaking and notify the player accordingly.
        const timeoutId = setTimeout(() => {
            if (this.queue1v1.has(player.player_id)) {
                this.queue1v1.delete(player.player_id);
                console.log(`Player ${player.player_id} removed from 1v1 queue due to timeout`); // log expiration
                onExpire(player);
            }
        }, MAX_QUEUE_TIME_MS);
        player.queueTimeoutId = timeoutId;

        // ✅ UTC-21 ID 1: Valid player added
        queue.set(player.player_id, player);
        return { message: "Player added to 1v1 queue successfully" };
    }

    // ✅ UTC-21: queueTeam for 3v3
    queueTeam(team: Team, onExpire: (team: Team) => void): { message?: string; error_message?: string } {
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

        const timeoutId = setTimeout(() => {
            if (queue.has(team.team_id)) {
                queue.delete(team.team_id);
                console.log(`Team ${team.team_id} removed from 3v3 queue due to timeout`);
                onExpire(team);
            }
        }, MAX_QUEUE_TIME_MS);
        team.queueTimeoutId = timeoutId;

        // ✅ UTC-21 ID 1: Valid team added
        queue.set(team.team_id, team);
        return { message: "Team added to 3v3 queue successfully" };
    }

    // ✅ UTC-22: startMatch
    startMatch1v1(): { message?: string; error_message?: string } {
        const queue = this.queue1v1;
        const players = Array.from(queue.values());

        // ✅ UTC-22 ID 2: Not enough players
        if (players.length < 2) {
            return { error_message: "Not enough players to start a 1v1 match" };
        }

        // ✅ UTC-22 ID 1: Enough players queued
        const matchPlayers = Array.from(queue.values())
            .sort((a, b) => matchmakingScore(b) - matchmakingScore(a))
            .slice(0, 2);

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

    startMatch3v3(): { message?: string; error_message?: string } {
        const queue = this.queue3v3;
        const teams = Array.from(queue.values());

        // ✅ UTC-22 ID 2: Not enough teams
        if (teams.length < 2) {
            return { error_message: "Not enough teams to start a 3v3 match" };
        }

        // ✅ UTC-22 ID 1: Enough teams queued
        const matchTeams = Array.from(queue.values())
            .sort((a, b) => teamScore(b) - teamScore(a))
            .slice(0, 2);
        const [teamA, teamB] = matchTeams;

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

    // Cancel queue methods
    cancelPlayerQueue(playerId: string) {
        const player = this.queue1v1.get(playerId);
        if (player) {
            if (player.queueTimeoutId) clearTimeout(player.queueTimeoutId);
            this.queue1v1.delete(playerId);
            return { message: `Player ${playerId} removed from matchmaking queue` };
        }
        return { error_message: `Player ${playerId} was not in matchmaking queue` };
    }

    cancelTeamQueue(teamId: string): { message?: string; error_message?: string } {
        const team = this.queue3v3.get(teamId);
        if (team) {
            if ((team as any).queueTimeoutId) clearTimeout((team as any).queueTimeoutId);
            this.queue3v3.delete(teamId);
            return { message: `Team ${teamId} removed from matchmaking queue` };
        }
        return { error_message: `Team ${teamId} was not in matchmaking queue` };
    }
}
