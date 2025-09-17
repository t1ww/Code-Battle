// backend\src\controllers\question.controller.ts
import { Request, Response } from "express";
import { QuestionService } from "@/services/question.service";
import { QuestionResponse } from "@/dtos/question.dto";

export class QuestionController {
    private questionService = new QuestionService();

    async getQuestionById(req: Request, res: Response) {
        // ✅ UTC-04 ID 4: Invalid input format
        if (!req.params || typeof req.params !== "object" || !("id" in req.params)) {
            res.status(400).json({ error_message: "Invalid input format, required question_id." });
            return;
        }

        const question_id = req.params.id;

        // ✅ UTC-04 ID 3: Empty question ID
        if (!question_id) {
            res.status(400).json({ error_message: "Question ID is required." });
            return;
        }

        const question = await this.questionService.getQuestionById(question_id);

        // ✅ UTC-04 ID 2: Question not found (handled via return structure)
        if ("error_message" in question) {
            res.status(404).json(question);
            return;
        }

        // ✅ UTC-04 ID 1: Valid question ID — convert id to string for consistency
        res.status(200).json({
            ...question,
            id: question.id.toString(),
        });
    }

    async getAQuestion(req: Request, res: Response) {
        if (!req.query || typeof req.query !== "object" || !("level" in req.query)) {
            res.status(400).json({
                error_message: "Invalid input format, required level of; Easy, Medium, Hard.",
            });
            return;
        }

        const level = req.query.level as string;

        if (!level) {
            res.status(400).json({ error_message: "Level input must not be empty." });
            return;
        }

        if (!["Easy", "Medium", "Hard"].includes(level)) {
            res.status(400).json({ error_message: "Invalid level input." });
            return;
        }

        try {
            const question: QuestionResponse | null | { error_message: string } =
                await this.questionService.getAQuestion(level as "Easy" | "Medium" | "Hard");

            if (!question) {
                res.status(404).json({ error_message: "Question not found." });
                return;
            }

            res.status(200).json(question);
        } catch (err) {
            // 🔎 log full error
            console.error("[BE] getAQuestion error:", err);

            const message =
                err instanceof Error
                    ? err.message
                    : typeof err === "string"
                        ? err
                        : "Unknown error";

            res.status(500).json({ error_message: "Error fetching question", details: message });
        }
    }

    async getThreeQuestions(_req: Request, res: Response) {
        try {
            const questions: QuestionResponse[] | { error_message: string } =
                await this.questionService.getRandomQuestions();

            // ✅ UTC-06 ID 2: No questions found
            if ("error_message" in questions) {
                res.status(404).json(questions);
                return;
            }

            // ✅ UTC-06 ID 1: Valid random questions
            res.status(200).json(questions);
        } catch {
            res.status(500).json({ error_message: "Error fetching random questions." });
        }
    }

    async getRandomQuestions(req: Request, res: Response) {
        // ✅ UTC-06 ID 3: Optional query param `count`
        let count = 3;
        if (req.query && typeof req.query.count === "string") {
            const parsed = parseInt(req.query.count, 10);
            if (!isNaN(parsed) && parsed > 0) {
                count = parsed;
            }
        }

        try {
            const questions: QuestionResponse[] | { error_message: string } =
                await this.questionService.getRandomQuestions(count);

            // ✅ UTC-06 ID 2: No questions found
            if ("error_message" in questions) {
                res.status(404).json(questions);
                return;
            }

            // ✅ UTC-06 ID 1: Valid random questions
            res.status(200).json(questions);
        } catch {
            res.status(500).json({ error_message: "Error fetching random questions." });
        }
    }

    async createQuestion(req: Request, res: Response) {
        // Validate request body format
        if (!req.body || typeof req.body !== "object") {
            res.status(400).json({
                error_message: "Invalid input format for creating question.",
            });
            return;
        }

        try {
            // Call service to create question
            const newQuestion: QuestionResponse | { error_message: string } = await this.questionService.createQuestion(req.body);
            res.status(201).json(newQuestion);
        } catch (err) {
            // Handle possible errors
            const errorMessage = err instanceof Error ? err.message : "Error creating question.";
            res.status(400).json({ error_message: errorMessage });
        }
    }

    async updateQuestion(req: Request, res: Response) {
        // Validate path param presence and format
        if (!req.params || typeof req.params !== "object" || !("id" in req.params)) {
            res.status(400).json({
                error_message: "Invalid input format, required question_id.",
            });
            return;
        }

        const question_id = req.params.id;

        // Validate that question ID is not empty
        if (!question_id) {
            res.status(400).json({
                error_message: "Question ID is required.",
            });
            return;
        }

        // Validate request body format
        if (!req.body || typeof req.body !== "object") {
            res.status(400).json({
                error_message: "Invalid input format for updating question.",
            });
            return;
        }

        try {
            // Call service to update question
            const updated: QuestionResponse | null | { error_message: string } = await this.questionService.updateQuestion(question_id, req.body);

            // Handle case where question does not exist
            if (!updated) {
                res.status(404).json({ error_message: "Question not found." });
                return;
            }

            res.status(200).json(updated);
        } catch (err) {
            // Handle possible errors
            const errorMessage = err instanceof Error ? err.message : "Error updating question.";
            res.status(400).json({ error_message: errorMessage });
        }
    }
}
