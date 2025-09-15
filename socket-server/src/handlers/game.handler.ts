// socket-server/src/handlers/game.handler.ts
import type { Server, Socket } from "socket.io";
import { GameService } from "@/services/game.service";

export function registerGameHandlers(io: Server, socket: Socket, gameService: GameService) {
    // Sabotage: one team sends an effect to the other
    socket.on("sabotage", ({ gameId, team, payload }) => {
        try {
            gameService.handleSabotage(gameId, team, payload);
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
        if (game) {
            socket.emit("gameState", {
                gameId,
                questions: game.questions,
                progress: game.progress,
                finished: game.finished,
            });
        } else {
            socket.emit("errorMessage", { message: "Game not found" });
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
