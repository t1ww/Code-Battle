import { Socket } from "socket.io";

interface QueuedPlayer {
    player_id: string;
    socket: Socket;
}

export class MatchmakingService {
    private queue: Map<string, QueuedPlayer> = new Map();

    // ✅ UTC-21: queuePlayer
    queuePlayer(player: QueuedPlayer): { message?: string; error_message?: string } {
        // ✅ UTC-21 ID 3: Invalid player object
        if (!player || typeof player !== "object" || !("player_id" in player) || !("socket" in player)) {
            return { error_message: "Invalid player object" };
        }

        // ✅ UTC-21 ID 4: Empty player
        if (!player.player_id || !player.socket || typeof player.socket.emit !== "function") {
            return { error_message: "Player is required" };
        }

        // ✅ UTC-21 ID 2: Duplicate player
        if (this.queue.has(player.player_id)) {
            return { error_message: "Player already in queue" };
        }

        // ✅ UTC-21 ID 1: Valid player added
        this.queue.set(player.player_id, player);
        return { message: "Player added to queue successfully" };
    }

    // ✅ UTC-22: startMatch
    startMatch(): { message?: string; error_message?: string } {
        const players = Array.from(this.queue.values());

        // ✅ UTC-22 ID 2: Not enough players
        if (players.length < 3) {
            return { error_message: "Not enough players to start a match" };
        }

        // ✅ UTC-22 ID 1: Enough players queued
        const matchPlayers = players.slice(0, 3);
        matchPlayers.forEach((p) => {
            p.socket.emit("matchStarted", { player_id: p.player_id });
            this.queue.delete(p.player_id);
        });

        return { message: "Match start successfully" };
    }
}
