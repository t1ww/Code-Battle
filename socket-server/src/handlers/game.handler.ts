// socket-server/src/handlers/game.handler.ts
import type { Server, Socket } from "socket.io";
import { GameService } from "@/services/game.service";
import { sanitizeTeam } from "@/utils/sanitize";
import { Team } from "@/types";

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
    socket.on("questionFinished", ({ gameId, team, questionIndex }) => {
        try {
            gameService.handleQuestionFinished(gameId, team, questionIndex);
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

        const playerId = socket.data.player.player_id;
        const playerTeam = gameService.getPlayerTeam(gameId, playerId);
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

    // DEV: Create a dummy game for testing
    socket.on("createDevGame", async ({ playerId }) => {
        try {
            const dummyTeam1: Team = {
                team_id: "dev-team1",
                players: [{
                    player_id: playerId, name: "DEV Player", socket,
                    email: ""
                }]
            };
            const dummyTeam2: Team = {
                team_id: "dev-team2",
                players: [{ player_id: "opponent-dev", name: "DEV Opponent", socket, email: "" }]
            };

            // Dummy questions for dev mode (skip API)
            const dummyQuestions = [
                {
                    id: 1,
                    question_name: "Add Two Numbers",
                    description: "Write a function that takes two integers and returns their sum.",
                    time_limit: 5,
                    level: "Easy",
                    test_cases: [
                        { input: "1 2", expected_output: "3", score: 1 },
                        { input: "10 5", expected_output: "15", score: 1 },
                    ]
                },
                {
                    id: 2,
                    question_name: "Reverse String",
                    description: "Write a function that reverses a given string.",
                    time_limit: 7,
                    level: "Medium",
                    test_cases: [
                        { input: "hello", expected_output: "olleh", score: 1 },
                        { input: "abc", expected_output: "cba", score: 1 },
                    ]
                },
                {
                    id: 3,
                    question_name: "Factorial",
                    description: "Write a function that calculates the factorial of a number.",
                    time_limit: 10,
                    level: "Hard",
                    test_cases: [
                        { input: "5", expected_output: "120", score: 1 },
                        { input: "3", expected_output: "6", score: 1 },
                    ]
                }
            ];

            const gameId = `dev-${Date.now()}`;

            const game = {
                gameId,
                team1: dummyTeam1,
                team2: dummyTeam2,
                questions: dummyQuestions,
                progress: {
                    team1: Array(dummyQuestions.length).fill(false),
                    team2: Array(dummyQuestions.length).fill(false)
                },
                finished: false,
                drawVotes: new Set<string>(),
            };

            socket.emit("devGameCreated", {
                gameId,
                questions: dummyQuestions,
                progress: game.progress,
                finished: game.finished,
                team1: sanitizeTeam(dummyTeam1),
                team2: sanitizeTeam(dummyTeam2),
                playerTeam: "team1", // always put requester on team1
            });
        } catch (err) {
            console.error("Failed to create DEV game:", err);
            socket.emit("errorMessage", { message: "Failed to create DEV game" });
        }
    });

}
