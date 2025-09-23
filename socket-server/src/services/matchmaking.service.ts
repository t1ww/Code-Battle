// socket-server/src/services/matchmaking.service.ts
import { PlayerSession, Team } from "@/types";
import { Server } from "socket.io";
import { GameService } from "@/services/game.service";

const TIMEOUT_MESSAGE = "No suitable match found. You can re-queue if you wish. Or try bring some friends C:";
const MAX_QUEUE_TIME_MS = 30_000; // 60 seconds

// Helper functions
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
function createSoloTeam(player: PlayerSession): Team {
    return {
        team_id: `solo-${player.player_id}`,
        players: [player],
    };
}

// Matchmaking Service class
export class MatchmakingService {
    constructor(private io: Server, private gameService: GameService) { }

    private queue1v1Normal: Map<string, PlayerSession> = new Map();
    private queue1v1Timed: Map<string, PlayerSession> = new Map();
    private queue3v3Normal: Map<string, Team> = new Map();
    private queue3v3Timed: Map<string, Team> = new Map();

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
    queuePlayer(player: PlayerSession, timeLimit: boolean): { message?: string; error_message?: string } {
        try {
            // ✅ UTC-21 ID 3: Invalid player object
            if (!this.isPlayerSession(player)) {
                return { error_message: "Invalid player object" };
            }

            // ✅ UTC-21 ID 4: Empty player
            if (!player.player_id || !player.socket) {
                return { error_message: "Player is required" };
            }

            const queue = timeLimit ? this.queue1v1Timed : this.queue1v1Normal;

            // ✅ UTC-21 ID 2: Duplicate player
            if (queue.has(player.player_id)) {
                return { error_message: "Player already in queue" };
            }

            // ✅ SRS-086: The system shall pair players or teams based on matchmaking criteria including player connection quality and wait time.
            player.connectionQuality = measureConnectionQuality(player); // custom fn or heuristic
            player.joinedQueueAt = Date.now();

            // ✅ SRS-091: If no suitable match is found within a timeout period, the system shall cancel matchmaking and notify the player accordingly.
            const timeoutId = setTimeout(() => {
                if (queue.has(player.player_id)) {
                    queue.delete(player.player_id);
                    player.socket.emit("queueTimeout", { message: TIMEOUT_MESSAGE });
                }
            }, MAX_QUEUE_TIME_MS);
            player.queueTimeoutId = timeoutId;

            // ✅ UTC-21 ID 1: Valid player added
            queue.set(player.player_id, player);
            return { message: `Player added to 1v1 queue ${timeLimit ? "with time limit " : ""}successfully` };
        } catch (err) {
            // ✅ SRS-092: If a server error occurs during matchmaking, the frontend shall display: "Matchmaking service is currently unavailable. Please try again later." [UI-04-06]
            console.error("Matchmaking error:", err);
            player.socket.emit("matchmakingError", {
                message: "Matchmaking service is currently unavailable. Please try again later."
            });
            return { error_message: "Matchmaking service error" };
        }
    }

    // ✅ UTC-21: queueTeam for 3v3
    queueTeam(team: Team, timeLimit: boolean): { message?: string; error_message?: string } {
        try {
            // ✅ UTC-21 ID 3: Invalid team object
            if (!this.isTeam(team)) {
                return { error_message: "Team must consist of exactly 3 valid player sessions" };
            }

            const queue = timeLimit ? this.queue3v3Timed : this.queue3v3Normal;

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
                    this.io.to(team.team_id).emit("queueTimeout", { message: TIMEOUT_MESSAGE });
                }
            }, MAX_QUEUE_TIME_MS);
            team.queueTimeoutId = timeoutId;

            // ✅ UTC-21 ID 1: Valid team added
            queue.set(team.team_id, team);
            return { message: `Team added to 3v3 queue ${timeLimit ? "with time limit " : ""}successfully` };
        } catch (err) {
            // ✅ SRS-092: If a server error occurs during matchmaking, the frontend shall display: "Matchmaking service is currently unavailable. Please try again later." [UI-04-06]
            console.error("Matchmaking error:", err);
            this.io.to(team.team_id).emit("matchmakingError", {
                message: "Matchmaking service is currently unavailable. Please try again later."
            });
            return { error_message: "Matchmaking service error" };
        }
    }

    // ✅ UTC-22: startMatch
    startMatch1v1(timed: boolean = false): { message?: string; error_message?: string } {
        const queue = timed ? this.queue1v1Timed : this.queue1v1Normal;
        const players = Array.from(queue.values());

        if (players.length < 2) return { error_message: "Not enough players to start a 1v1 match" };

        const matchPlayers = players.sort((a, b) => matchmakingScore(b) - matchmakingScore(a)).slice(0, 2);
        const [p1, p2] = matchPlayers;

        // Emit match info & start
        [p1, p2].forEach(p => {
            const opponent = p === p1 ? p2 : p1;
            p.socket.emit("matchInfo", {
                you: { player_id: p.player_id, name: p.name, email: p.email, token: null },
                friends: [],
                opponents: [{ player_id: opponent.player_id, name: opponent.name, email: opponent.email, token: null }]
            });
            if (p.queueTimeoutId) clearTimeout(p.queueTimeoutId);
            p.socket.emit("matchStarted", { player_id: p.player_id });
            queue.delete(p.player_id);
        });

        this.gameService.createGame(createSoloTeam(p1), createSoloTeam(p2));
        return { message: "1v1 match started successfully" };
    }

    startMatch3v3(timed: boolean = false): { message?: string; error_message?: string } {
        const queue = timed ? this.queue3v3Timed : this.queue3v3Normal;
        const teams = Array.from(queue.values());

        if (teams.length < 2) return { error_message: "Not enough teams to start a 3v3 match" };

        const [teamA, teamB] = teams.sort((a, b) => teamScore(b) - teamScore(a)).slice(0, 2);

        const prepareData = (team: Team) => team.players.map(p => ({
            player_id: p.player_id,
            name: p.name,
            email: p.email,
            token: null
        }));

        const teamAData = prepareData(teamA);
        const teamBData = prepareData(teamB);

        const emitMatch = (team: Team, friends: any[], opponents: any[], teamId: string) => {
            team.players.forEach(p => {
                p.socket.emit("matchInfo", { you: { player_id: p.player_id, name: p.name, email: p.email, token: null }, friends, opponents });
                if (p.queueTimeoutId) clearTimeout(p.queueTimeoutId);
                p.socket.emit("matchStarted", { player_id: p.player_id, team_id: teamId });
                queue.delete(p.player_id);
            });
        };

        emitMatch(teamA, teamAData.filter(fp => !teamA.players.some(p => p.player_id === fp.player_id)), teamBData, teamA.team_id);
        emitMatch(teamB, teamBData.filter(fp => !teamB.players.some(p => p.player_id === fp.player_id)), teamAData, teamB.team_id);

        this.gameService.createGame(teamA, teamB);
        return { message: "3v3 match started successfully" };
    }

    // Cancel queue methods
    cancelPlayerQueue(playerId: string, timed: boolean) {
        const queue = timed ? this.queue1v1Timed : this.queue1v1Normal;
        const player = queue.get(playerId);
        if (player) {
            if (player.queueTimeoutId) clearTimeout(player.queueTimeoutId);
            queue.delete(playerId);
            return { message: `Player ${playerId} removed from matchmaking queue` };
        }
        return { error_message: `Player ${playerId} was not in matchmaking queue` };
    }

    cancelTeamQueue(teamId: string, timed: boolean) {
        const queue = timed ? this.queue3v3Timed : this.queue3v3Normal;
        const team = queue.get(teamId);
        if (team) {
            if ((team as any).queueTimeoutId) clearTimeout((team as any).queueTimeoutId);
            queue.delete(teamId);
            return { message: `Team ${teamId} removed from matchmaking queue` };
        }
        return { error_message: `Team ${teamId} was not in matchmaking queue` };
    }
}
