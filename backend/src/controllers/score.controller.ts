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

    try {
        await scoreService.submitScore(body as SubmitScoreDTO); // pass full object

        // ✅ UTC-06 ID 1: Valid score submission
        res.status(200).json({ message: "Score successfully submitted" });
    } catch (err) {
        res.status(500).json({
            error_message: "Failed to submit score",
        });
    }
};


export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const { question_id } = req.query;
        if (typeof question_id !== "string") return res.status(400).json({ error: "Missing question_id" });

        const leaderboard = await scoreService.getLeaderboard(question_id);
        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: "Failed to get leaderboard", details: err });
    }
};

export const getTopScore = async (req: Request, res: Response) => {
    try {
        const { question_id, player_id } = req.query;
        if (typeof question_id !== "string" || typeof player_id !== "string")
            return res.status(400).json({ error: "Missing question_id or player_id" });

        const topScore = await scoreService.getTopScore(question_id, player_id);
        if (!topScore) return res.status(404).json({ error: "Score not found" });

        res.json(topScore);
    } catch (err) {
        res.status(500).json({ error: "Failed to get score", details: err });
    }
};
