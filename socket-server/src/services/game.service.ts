// socket-server/src/services/game.service.ts
import { Server } from "socket.io";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import type { Team } from "@/types";
import codeRunnerApi from "@/clients/coderunner.api";

interface GameRoom {
    gameId: string;
    team1: Team;
    team2: Team;
    questions: any[]; // replace with Question type if you have one
    progress: Record<"team1" | "team2", number>;
    finished: boolean;
}

export class GameService {
    private io: Server;
    private games: Map<string, GameRoom> = new Map();

    constructor(io: Server) {
        this.io = io;
    }

    /** Create a game room with two teams, fetch questions from API */
    async createGame(team1: Team, team2: Team): Promise<GameRoom> {
        const gameId = uuidv4();
        const questions: any[] = [];
        for (let i = 0; i < 3; i++) {
            const q = await this.fetchQuestion();
            questions.push(q);
        }

        const game: GameRoom = {
            gameId,
            team1,
            team2,
            questions,
            progress: { team1: 0, team2: 0 },
            finished: false,
        };

        this.games.set(gameId, game);

        // Join players to global game room and their team rooms
        for (const player of team1.players) {
            player.socket.join(`game-${gameId}`);        // global game events
            player.socket.join(`game-${gameId}-team1`);  // team-specific updates
        }

        for (const player of team2.players) {
            player.socket.join(`game-${gameId}`);
            player.socket.join(`game-${gameId}-team2`);
        }

        // Notify clients that game started with questions
        this.io.to(`game-${gameId}`).emit("gameStart", {
            gameId,
            team1: team1.team_id,
            team2: team2.team_id,
            questions: game.questions,
        });

        return game;
    }

    /** Handle sabotage event: relay to opponent team */
    handleSabotage(gameId: string, fromTeam: "team1" | "team2", payload: any) {
        const game = this.games.get(gameId);
        if (!game || game.finished) return;

        const targetTeam = fromTeam === "team1" ? "team2" : "team1";
        this.io.to(`game-${gameId}`).emit("sabotage", {
            from: fromTeam,
            to: targetTeam,
            payload,
        });
    }

    /** Handle when a team finishes a question */
    handleQuestionFinished(gameId: string, teamKey: "team1" | "team2") {
        const game = this.games.get(gameId);
        if (!game || game.finished) return;

        game.progress[teamKey]++;

        this.io.to(`game-${gameId}`).emit("questionProgress", {
            team: teamKey,
            progress: game.progress[teamKey],
        });

        this.checkGameEnd(game);
    }

    /** Check if game should end and announce winner */
    private checkGameEnd(game: GameRoom) {
        if (game.finished) return;

        const team1Done = game.progress.team1 >= 3;
        const team2Done = game.progress.team2 >= 3;

        if (team1Done || team2Done) {
            game.finished = true;
            let winner: "team1" | "team2" | "draw" = "draw";

            if (team1Done && !team2Done) winner = "team1";
            else if (team2Done && !team1Done) winner = "team2";
            else if (team1Done && team2Done) winner = "draw";

            this.io.to(`game-${game.gameId}`).emit("gameEnd", {
                winner,
                progress: game.progress,
            });

            // Remove all players from game and team rooms
            for (const player of game.team1.players) {
                player.socket.leave(`game-${game.gameId}`);
                player.socket.leave(`game-${game.gameId}-team1`);
            }
            for (const player of game.team2.players) {
                player.socket.leave(`game-${game.gameId}`);
                player.socket.leave(`game-${game.gameId}-team2`);
            }

            this.games.delete(game.gameId);
        }
    }

    /** Get active game */
    getGame(gameId: string): GameRoom | undefined {
        return this.games.get(gameId);
    }

    /** Fetch question from backend API */
    private async fetchQuestion() {
        try {
            const levels = ["Easy", "Medium", "Hard"];
            const level = levels[Math.floor(Math.random() * levels.length)]; // random level
            const res = await axios.get("http://localhost:5000/api/questions", { params: { level } }); // backend endpoint
            // If backend returns an array, pick a random question
            if (Array.isArray(res.data) && res.data.length > 0) {
                const randomIndex = Math.floor(Math.random() * res.data.length);
                return res.data[randomIndex];
            }
            // fallback if API returns a single object
            return res.data;
        } catch (err: any) {
            console.error("Failed to fetch question:", err.message ?? err);
            // Provide a fallback question to prevent server crash
            return {
                id: "fallback",
                title: "Fallback Question",
                description: "Could not load question from backend",
                testCases: [],
            };
        }
    }
}
