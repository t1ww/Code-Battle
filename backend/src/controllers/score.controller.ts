import { Request, Response } from "express";
import { ScoreService } from "@/services/score.service";

const scoreService = new ScoreService();

export const submitScore = async (req: Request, res: Response) => {
    try {
        await scoreService.submitScore(req.body);
        res.status(200).json({ message: "Score submitted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to submit score", details: err });
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
