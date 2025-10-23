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
    drawVoteTimeout?: NodeJS.Timeout;
    forfeitEnabled?: boolean;
    // inside GameRoom interface
    sabotagePoints?: Record<"team1" | "team2", number>;
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
            sabotagePoints: { team1: 0, team2: 0 },
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

    /** Create a test game room using predefined questions (no API calls) */
    async createTestGame(team1: Team, team2: Team): Promise<GameRoom> {
        const gameId = uuidv4();

        // Static test questions
        const questions: Question[] = [
            {
                id: "q1",
                question_name: "Sum Two Numbers",
                description: "Write a program that reads two integers and outputs their sum.",
                time_limit: 120,
                test_cases: [
                    { input: "1 2", expected_output: "3", score: 1 },
                    { input: "5 7", expected_output: "12", score: 1 },
                    { input: "10 15", expected_output: "25", score: 1 },
                ],
            },
            {
                id: "q2",
                question_name: "Reverse String",
                description: "Read a string and print its reversed version.",
                time_limit: 120,
                test_cases: [
                    { input: "hello", expected_output: "olleh", score: 1 },
                    { input: "abc", expected_output: "cba", score: 1 },
                    { input: "openai", expected_output: "ianepo", score: 1 },
                ],
            },
        ];

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
            sabotagePoints: { team1: 0, team2: 0 },
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
            sabotagePoints: { team1: 0, team2: 0 },
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

    // Handle sabotage for solo
    handleSabotage(gameId: string, targetTeam: "team1" | "team2") {
        const game = this.games.get(gameId);
        if (!game || game.finished) return;
        this.io.to(`game-${gameId}-${targetTeam}`).emit("sabotageReceived");
    }

    // Handle sabotage for team
    handleUseSabotage(gameId: string, useby: string, teamKey: "team1" | "team2") {
        const game = this.games.get(gameId);
        if (!game || game.finished) return;

        const opponentTeam = teamKey === "team1" ? "team2" : "team1";

        // Check if enough points
        if (game.sabotagePoints![teamKey] <= 0) {
            this.io.to(`game-${gameId}-${teamKey}`).emit("sabotageFail", {
                message: `Not enough sabotage points to use sabotage`,
            });
            return;
        }
        // Deduct points
        const cost = 1;
        game.sabotagePoints![teamKey] -= cost;

        // Notify all teammates of new points
        console.log('Emitting teamSabotageUpdate from handleUseSabotage')
        this.io.to(`game-${gameId}-${teamKey}`).emit("teamSabotageUpdate", {
            updateMessage: `Team sabotage used by ${useby}, ${game.sabotagePoints![teamKey]} points left.`,
            points: game.sabotagePoints![teamKey],
        });

        // Also notify enemies of the sabotage points
        this.io.to(`game-${gameId}-${opponentTeam}`).emit("enemySabotageUpdate", {
            points: game.sabotagePoints![teamKey],
        });

        // Perform sabotage on opponent
        this.handleSabotage(gameId, opponentTeam);
    }

    /**
     * Handle when a team finishes (or partially finishes) test cases in a question.
     * passedIndices: indices of test cases that were passed in this submission attempt
     */
    handleQuestionFinished(gameId: string, teamKey: "team1" | "team2", questionIndex: number, passedIndices: number[], finishedBy: string) {
        console.log('handleQuestionFinished', {
            gameId,
            teamKey,
            questionIndex,
            passedIndices,
            finishedBy
        });
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
            // Shared team sabotage points
            game.sabotagePoints![teamKey] += newlyCleared;
            console.log('Emitting teamSabotageUpdate from handleQuestionFinished')
            this.io.to(`game-${gameId}-${teamKey}`).emit("teamSabotageUpdate", {
                updateMessage: `Awarded sabotage point by ${finishedBy}!`,
                points: game.sabotagePoints![teamKey],
            });
            const opponentTeam = teamKey === "team1" ? "team2" : "team1";
            // Also notify enemies of the sabotage points
            this.io.to(`game-${gameId}-${opponentTeam}`).emit("enemySabotageUpdate", {
                points: game.sabotagePoints![teamKey],
            });
        }

        // If all test-cases in a question are now true, that was already handled by your earlier logic,
        // but note: game end currently uses per-test progress (unchanged).
        this.checkGameEnd(game);
    }

    /** Check if game should end and announce winner */
    private checkGameEnd(game: GameRoom) {
        if (game.finished) return;

        // Count how many questions each team has fully passed in a single submission
        const team1Cleared = game.progressFullPass.team1.filter(Boolean).length;
        const team2Cleared = game.progressFullPass.team2.filter(Boolean).length;

        const requiredToWin = 2;

        const team1Done = team1Cleared >= requiredToWin;
        const team2Done = team2Cleared >= requiredToWin;

        if (team1Done || team2Done) {
            game.finished = true;
            let winner: "team1" | "team2" | "draw" = "draw";

            if (team1Done && !team2Done) winner = "team1";
            else if (team2Done && !team1Done) winner = "team2";
            else if (team1Done && team2Done) winner = "draw";

            this.io.to(`game-${game.gameId}`).emit("gameEnd", {
                winner,
                progress: game.progress,
                progressFullPass: game.progressFullPass,
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

    deleteGame(gameId: string) {
        const game = this.games.get(gameId);
        if (!game) return;
        clearTimeout(game.drawVoteTimeout);
        this.games.delete(gameId);
    }
}
