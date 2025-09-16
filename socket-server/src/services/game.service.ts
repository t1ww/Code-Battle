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
    progress: Record<"team1" | "team2", boolean[][]>;
    progressFullPass: Record<"team1" | "team2", boolean[]>;
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
        let questions: Question[] = [];

        // Fetch 3 questions via fetchQuestion()
        questions = await this.fetchQuestion();

        // build per-question per-test-case boolean arrays
        const progress = {
            team1: questions.map(q => Array((q.test_cases ?? []).length).fill(false)),
            team2: questions.map(q => Array((q.test_cases ?? []).length).fill(false)),
        };
        const progressFullPass = {
            team1: questions.map(_ => false),
            team2: questions.map(_ => false),
        };

        const game: GameRoom = {
            gameId,
            team1,
            team2,
            questions,
            progress,
            progressFullPass,
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
            progress: game.progress,
            progressFullPass: game.progressFullPass,
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
        const progressFullPass = {
            team1: questions.map(_ => false),
            team2: questions.map(_ => false),
        };

        const game: GameRoom = {
            gameId,
            team1,
            team2,
            questions,
            progress,
            progressFullPass,
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

        // Normalize passedIndices to unique, valid indices
        const uniquePassed = Array.from(new Set((passedIndices || []).map(Number)))
            .filter(idx => Number.isInteger(idx) && idx >= 0 && idx < (question.test_cases ?? []).length);

        // Always update per-test progress (so partial passes still count for sabotage)
        let newlyCleared = 0;
        for (const idx of uniquePassed) {
            if (!game.progress[teamKey][questionIndex][idx]) {
                game.progress[teamKey][questionIndex][idx] = true;
                newlyCleared++;
            }
        }

        // If this submission passed ALL tests in one run, mark full-pass for the question
        if (uniquePassed.length === (question.test_cases ?? []).length) {
            // ensure array exists
            if (!game.progressFullPass[teamKey]) {
                game.progressFullPass[teamKey] = game.questions.map(_ => false); // fallback init
            }
            game.progressFullPass[teamKey][questionIndex] = true;
        }

        // Notify clients about the updated per-question progress and full-pass flags
        this.io.to(`game-${gameId}`).emit("questionProgress", {
            team: teamKey,
            progress: game.progress[teamKey],        // boolean[][]
            progressFullPass: game.progressFullPass[teamKey], // boolean[]
            questionIndex
        });

        // Award sabotage points equal to newly cleared test cases (emit to that team's players)
        if (newlyCleared > 0) {
            this.io.to(`game-${gameId}-${teamKey}`).emit("awardSabotage", { amount: newlyCleared });
        }

        // If all test-cases in a question are now true, that was already handled by your earlier logic,
        // but note: game end currently uses per-test progress (unchanged).
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

    /** Fetch 3 random questions from backend API */
    private async fetchQuestion(): Promise<Question[]> {
        try {
            const res = await api.get("/questions/three"); // our new endpoint
            console.log("Fetched questions:", res.data);

            // normalize response to Question[]
            if (Array.isArray(res.data) && res.data.length > 0) {
                return res.data.map((q, i) => ({
                    id: q.id ?? `q-${i}`,
                    question_name: q.question_name ?? q.title ?? `Question ${i + 1}`,
                    description: q.description,
                    time_limit: q.time_limit ?? 10,
                    level: q.level ?? "Easy",
                    test_cases: (q.test_cases ?? q.testCases ?? []) as TestCase[],
                }));
            }

            // fallback if response not array
            return [
                {
                    id: "fallback",
                    question_name: "Fallback Question",
                    description: "Could not load question from backend",
                    time_limit: 10,
                    level: "Easy",
                    test_cases: [],
                },
            ];
        } catch (err: any) {
            console.error("Failed to fetch 3 random questions:", err.message ?? err);
            return [
                {
                    id: "fallback",
                    question_name: "Fallback Question",
                    description: "Could not load question from backend",
                    time_limit: 10,
                    level: "Easy",
                    test_cases: [],
                },
            ];
        }
    }
}
