// socket-server/src/services/game.service.ts
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import type { Team } from "@/types";
import api from "@/clients/crud.api";

interface TestCase {
    input: string;
    expected_output: string;
    score: number;
}
interface Question {
    id: number | string;
    question_name?: string;
    description?: string;
    time_limit?: number;
    level?: string;
    test_cases: TestCase[];
}

export interface GameRoom {
    gameId: string;
    team1: Team;
    team2: Team;
    questions: Question[];
    // now per-question arrays of booleans (one boolean per test case)
    progress: Record<"team1" | "team2", boolean[][]>;
    finished: boolean;
    drawVotes?: Set<string>;
}

export class GameService {
    private io: Server;
    private games: Map<string, GameRoom> = new Map();

    constructor(io: Server) {
        this.io = io;
    }

    /** Create a game room fetching questions from API */
    async createGame(team1: Team, team2: Team): Promise<GameRoom> {
        const gameId = uuidv4();
        const questions: Question[] = [];
        for (let i = 0; i < 3; i++) {
            const q = await this.fetchQuestion();
            // ensure we have test_cases array shape
            questions.push({
                id: q.id ?? `q-${i}`,
                question_name: q.question_name ?? q.title ?? `Question ${i+1}`,
                description: q.description,
                time_limit: q.time_limit ?? 10,
                level: q.level ?? "Easy",
                test_cases: (q.test_cases ?? q.testCases ?? []) as TestCase[],
            });
        }

        // build per-question per-test-case boolean arrays
        const progress = {
            team1: questions.map(q => Array((q.test_cases ?? []).length).fill(false)),
            team2: questions.map(q => Array((q.test_cases ?? []).length).fill(false)),
        };

        const game: GameRoom = {
            gameId,
            team1,
            team2,
            questions,
            progress,
            finished: false,
            drawVotes: new Set<string>(),
        };

        this.games.set(gameId, game);

        // join sockets to rooms
        for (const player of team1.players) {
            player.socket.join(`game-${gameId}`);
            player.socket.join(`game-${gameId}-team1`);
        }
        for (const player of team2.players) {
            player.socket.join(`game-${gameId}`);
            player.socket.join(`game-${gameId}-team2`);
        }

        // notify start
        this.io.to(`game-${gameId}`).emit("gameStart", {
            gameId,
            team1: team1.team_id,
            team2: team2.team_id,
            questions: game.questions,
        });

        return game;
    }

    /** Create and register a dev game with provided questions (used by the dev handler) */
    createDevGame(team1: Team, team2: Team, questions: Question[]): GameRoom {
        const gameId = `dev-${Date.now()}`;
        const progress = {
            team1: questions.map(q => Array((q.test_cases ?? []).length).fill(false)),
            team2: questions.map(q => Array((q.test_cases ?? []).length).fill(false)),
        };

        const game: GameRoom = {
            gameId,
            team1,
            team2,
            questions,
            progress,
            finished: false,
            drawVotes: new Set<string>(),
        };

        this.games.set(gameId, game);

        // join players to rooms
        for (const player of team1.players) {
            player.socket.join(`game-${gameId}`);
            player.socket.join(`game-${gameId}-team1`);
        }
        for (const player of team2.players) {
            player.socket.join(`game-${gameId}`);
            player.socket.join(`game-${gameId}-team2`);
        }

        // notify clients
        this.io.to(`game-${gameId}`).emit("gameStart", {
            gameId,
            team1: team1.team_id,
            team2: team2.team_id,
            questions: game.questions,
        });

        return game;
    }

    /** Determine which team a player belongs to */
    getPlayerTeam(gameId: string, playerId: string): "team1" | "team2" | null {
        const game = this.games.get(gameId);
        if (!game) return null;

        if (game.team1.players.find(p => p.player_id === playerId)) return "team1";
        if (game.team2.players.find(p => p.player_id === playerId)) return "team2";
        return null;
    }

    /** Handle sabotage event: relay to opponent team */
    handleSabotage(gameId: string, targetTeam: "team1" | "team2") {
        const game = this.games.get(gameId);
        if (!game || game.finished) return;
        this.io.to(`game-${gameId}-${targetTeam}`).emit("sabotageReceived");
    }

    /**
     * Handle when a team finishes (or partially finishes) test cases in a question.
     * passedIndices: indices of test cases that were passed in this submission attempt
     */
    handleQuestionFinished(gameId: string, teamKey: "team1" | "team2", questionIndex: number, passedIndices: number[]) {
        const game = this.games.get(gameId);
        if (!game || game.finished) return;

        const question = game.questions[questionIndex];
        if (!question) return;

        // Ensure per-question array exists
        if (!game.progress[teamKey][questionIndex]) {
            game.progress[teamKey][questionIndex] = Array((question.test_cases ?? []).length).fill(false);
        }

        // Count newly cleared test cases (that were false before)
        let newlyCleared = 0;
        for (const idx of passedIndices) {
            if (idx >= 0 && idx < game.progress[teamKey][questionIndex].length) {
                if (!game.progress[teamKey][questionIndex][idx]) {
                    game.progress[teamKey][questionIndex][idx] = true;
                    newlyCleared++;
                }
            }
        }

        // Notify clients about the updated per-question progress for that team
        this.io.to(`game-${gameId}`).emit("questionProgress", {
            team: teamKey,
            progress: game.progress[teamKey], // array of arrays
            questionIndex
        });

        // Award sabotage points equal to newly cleared test cases (emit to that team's players)
        if (newlyCleared > 0) {
            this.io.to(`game-${gameId}-${teamKey}`).emit("awardSabotage", { amount: newlyCleared });
        }

        // If all test-cases in a question are now true, mark question as done (implicit)
        const allDoneForQuestion = game.progress[teamKey][questionIndex].every(Boolean);

        // Check if the game should end (if one team has all test-cases true across all questions)
        this.checkGameEnd(game);
    }


    /** Check if game should end and announce winner */
    private checkGameEnd(game: GameRoom) {
        if (game.finished) return;

        const team1Done = game.progress.team1.every(perQuestion => perQuestion.every(Boolean));
        const team2Done = game.progress.team2.every(perQuestion => perQuestion.every(Boolean));

        if (team1Done || team2Done) {
            game.finished = true;
            let winner: "team1" | "team2" | "draw" = "draw";

            if (team1Done && !team2Done) winner = "team1";
            else if (team2Done && !team1Done) winner = "team2";
            else if (team1Done && team2Done) winner = "draw";

            this.io.to(`game-${game.gameId}`).emit("gameEnd", {
                winner,
                progress: game.progress
            });

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
            const res = await api.get("/questions", { params: { level } }); // backend endpoint
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
                test_cases: [],
            };
        }
    }
}
