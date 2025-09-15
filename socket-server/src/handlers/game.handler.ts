// socket-server/src/handlers/game.handler.ts
import type { Server, Socket } from "socket.io";
import { GameService } from "@/services/game.service";
import { sanitizeTeam } from "@/utils/sanitize";

export function registerGameHandlers(io: Server, socket: Socket, gameService: GameService) {
    // Sabotage: one team sends an effect to the other
    socket.on("sabotage", ({ gameId, targetTeam }) => {
        try {
            gameService.handleSabotage(gameId, targetTeam);
        } catch (err) {
            console.error("Error handling sabotage:", err);
            socket.emit("errorMessage", { message: "Failed to sabotage" });
        }
    });

    // When a team finishes a question
    socket.on("questionFinished", ({ gameId, team }) => {
        try {
            gameService.handleQuestionFinished(gameId, team);
        } catch (err) {
            console.error("Error handling questionFinished:", err);
            socket.emit("errorMessage", { message: "Failed to finish question" });
        }
    });

    // Allow client to fetch current game state (for resync, reconnects, etc.)
    socket.on("getGameState", ({ gameId }) => {
        const game = gameService.getGame(gameId);
        if (!game) {
            socket.emit("errorMessage", { message: "Game not found" });
            return;
        }

        // Use socket reference instead of player_id
        const playerTeam = gameService.getPlayerTeamBySocket(gameId, socket);
        console.log(`Player ${socket.id} is on team:`, playerTeam);

        socket.emit("gameState", {
            gameId,
            questions: game.questions,
            progress: game.progress,
            finished: game.finished,
            team1: game.team1 ? sanitizeTeam(game.team1) : undefined,
            team2: game.team2 ? sanitizeTeam(game.team2) : undefined,
            playerTeam,
        });
    });

    socket.on("voteDraw", ({ gameId, player_id }) => {
        try {
            const game = gameService.getGame(gameId);
            if (!game) {
                socket.emit("errorMessage", { message: "Game not found" });
                return;
            }

            game.drawVotes?.add(player_id);

            const totalPlayers = game.team1.players.length + game.team2.players.length;
            io.to(`game-${gameId}`).emit("voteDrawResult", {
                votes: game.drawVotes?.size ?? 0,
                totalPlayers
            });

            if ((game.drawVotes?.size ?? 0) >= totalPlayers) {
                game.finished = true;
                io.to(`game-${gameId}`).emit("gameEnd", {
                    winner: "draw",
                    progress: game.progress
                });
            }

        } catch (err) {
            console.error("Failed to handle voteDraw:", err);
            socket.emit("errorMessage", { message: "Failed to vote draw" });
        }
    });

    socket.on("disconnect", () => {
        // Leave general game room
        const gameIds = Array.from(socket.rooms)
            .filter(r => r.startsWith("game-") && !r.includes(socket.id));

        gameIds.forEach(gameRoom => {
            socket.leave(gameRoom); // leave the global game room

            // Also leave team-specific room
            if (gameRoom.endsWith("-team1") || gameRoom.endsWith("-team2")) {
                socket.leave(gameRoom);
            }

            // Optional: update game state if you want to mark player as disconnected
            // Example: notify other players in the game
            io.to(gameRoom).emit("playerDisconnected", { socketId: socket.id });
        });
    });

}
