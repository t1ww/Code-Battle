import { Socket } from "socket.io";

interface QueuedPlayer {
    player_id: string;
    socket: Socket;
}

interface Team {
    team_id: string;
    players: QueuedPlayer[]; // must be exactly 3 players for 3v3
}

export class MatchmakingService {
    // Separate queues for 1v1 players and 3v3 teams
    private queue1v1: Map<string, QueuedPlayer> = new Map();
    private queue3v3: Map<string, Team> = new Map();

    private getQueue(mode: "1v1" | "3v3") {
        return mode === "1v1" ? this.queue1v1 : this.queue3v3;
    }

    // ✅ UTC-21: queuePlayer
    // Overloaded to accept either single player (1v1) or team (3v3)
    queuePlayer(playerOrTeam: QueuedPlayer | Team, mode: "1v1" | "3v3"): { message?: string; error_message?: string } {
        if (mode === "1v1") {
            // Validate single player input
            const player = playerOrTeam as QueuedPlayer;

            // ✅ UTC-21 ID 3: Invalid player object
            if (!player || typeof player !== "object" || !("player_id" in player) || !("socket" in player)) {
                return { error_message: "Invalid player object" };
            }

            // ✅ UTC-21 ID 4: Empty player
            if (!player.player_id || !player.socket || typeof player.socket.emit !== "function") {
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

        // For 3v3 mode: queue a full team
        const team = playerOrTeam as Team;

        // Validate team object
        if (
            !team ||
            typeof team !== "object" ||
            !team.team_id ||
            !Array.isArray(team.players) ||
            team.players.length !== 3
        ) {
            return { error_message: "Team must consist of exactly 3 players" };
        }

        // Validate each player in team
        for (const player of team.players) {
            if (
                !player ||
                typeof player !== "object" ||
                !player.player_id ||
                !player.socket ||
                typeof player.socket.emit !== "function"
            ) {
                return { error_message: "Invalid player in team" };
            }
        }

        const queue = this.queue3v3;

        // Check duplicate team
        if (queue.has(team.team_id)) {
            return { error_message: "Team already in queue" };
        }

        // Check no duplicate players across teams (optional, but recommended)
        for (const existingTeam of queue.values()) {
            for (const p of existingTeam.players) {
                if (team.players.some(tp => tp.player_id === p.player_id)) {
                    return { error_message: `Player ${p.player_id} already in another team queue` };
                }
            }
        }

        // ✅ UTC-21 ID 1: Valid team added
        queue.set(team.team_id, team);
        return { message: "Team added to 3v3 queue successfully" };
    }

    // ✅ UTC-22: startMatch
    startMatch(mode: "1v1" | "3v3"): { message?: string; error_message?: string } {
        if (mode === "1v1") {
            const queue = this.queue1v1;
            const players = Array.from(queue.values());

            // ✅ UTC-22 ID 2: Not enough players
            if (players.length < 2) {
                return { error_message: "Not enough players to start a 1v1 match" };
            }

            // ✅ UTC-22 ID 1: Enough players queued
            const matchPlayers = players.slice(0, 2);
            matchPlayers.forEach((p) => {
                p.socket.emit("matchStarted", { player_id: p.player_id });
                queue.delete(p.player_id);
            });

            return { message: "1v1 match started successfully" };
        }

        // 3v3 mode
        const queue = this.queue3v3;
        const teams = Array.from(queue.values());

        // ✅ UTC-22 ID 2: Not enough teams
        if (teams.length < 2) {
            return { error_message: "Not enough teams to start a 3v3 match" };
        }

        // ✅ UTC-22 ID 1: Enough teams queued
        const matchTeams = teams.slice(0, 2);
        matchTeams.forEach(team => {
            for (const player of team.players) {
                player.socket.emit("matchStarted", { player_id: player.player_id, team_id: team.team_id });
            }
            queue.delete(team.team_id);
        });

        return { message: "3v3 match started successfully" };
    }
}
