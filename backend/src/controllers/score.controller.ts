// backend\src\controllers\score.controller.ts
import { Request, Response } from "express";
import { ScoreService } from "@/services/score.service";
import { SubmitScoreDTO } from "@/dtos/score.dto";

const scoreService = new ScoreService();

export const submitScore = async (req: Request, res: Response) => {
    const body = req.body as Partial<SubmitScoreDTO>;

    // ✅ UTC-06 ID 3: Invalid input format
    if (
        !body ||
        typeof body !== "object" ||
        !("player_id" in body) ||
        !("question_id" in body) ||
        !("score" in body)
    ) {
        res.status(400).json({
            error_message: "Invalid input format, required player_id and question_id",
        });
        return;
    }

    const { player_id, question_id, score } = body;

    // ✅ UTC-06 ID 2: Empty fields
    if (!player_id || !question_id || score === null || score === undefined) {
        res.status(400).json({
            error_message: "All fields are required",
        });
        return;
    }

    // Successful submission
    try {
        const result = await scoreService.submitScore(body as SubmitScoreDTO); // pass full object
        res.status(200).json(result); // <-- send the actual message from service
    } catch (err) {
        res.status(500).json({
            error_message: "Failed to submit score",
        });
    }
};

export const getTopScore = async (req: Request, res: Response) => {
    const query = req.query;

    // ✅ UTC-07 ID 5: Invalid input format
    if (
        !query ||
        typeof query !== "object" ||
        !("player_id" in query) ||
        !("question_id" in query)
    ) {
        res.status(400).json({
            error_message: "Invalid input format, required player_id and question_id",
        });
        return;
    }

    const { player_id, question_id } = query;

    // ✅ UTC-07 ID 4: Empty fields
    if (
        typeof player_id !== "string" ||
        typeof question_id !== "string" ||
        !player_id.trim() ||
        !question_id.trim()
    ) {
        res.status(400).json({
            error_message: "All fields are required",
        });
        return;
    }

    try {
        const topScore = await scoreService.getTopScore(question_id, player_id);

        // ✅ UTC-07 ID 2 & 3: Player or score not found
        if (!topScore) {
            res.status(404).json({
                error_message: "Player not found or Score not found",
            });
            return;
        }

        // ✅ UTC-07 ID 1: Valid request
        res.status(200).json(topScore);
    } catch (err) {
        res.status(500).json({
            error_message: "Failed to get score",
        });
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    const query = req.query;

    // ✅ UTC-08 ID 4: Invalid input format
    if (!query || typeof query !== "object" || !("question_id" in query)) {
        res.status(400).json({
            error_message: "Invalid input format, required question_id",
        });
        return;
    }

    const question_id = query.question_id;

    // ✅ UTC-08 ID 3: Empty question ID
    if (typeof question_id !== "string" || !question_id.trim()) {
        res.status(400).json({
            error_message: "Question ID is required",
        });
        return;
    }

    try {
        const leaderboard = await scoreService.getLeaderboard(question_id);

        // ✅ UTC-08 ID 2: Unknown question ID
        if ("error_message" in leaderboard) {
            res.status(404).json(leaderboard);
            return;
        }

        // ✅ UTC-08 ID 1: Valid leaderboard
        res.status(200).json(leaderboard);
    } catch {
        res.status(500).json({
            error_message: "Failed to get leaderboard",
        });
    }
};
