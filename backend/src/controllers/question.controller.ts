import { Request, Response } from "express";
import { QuestionService } from "@/services/question.service";

export class QuestionController {
    private questionService = new QuestionService();

    async getQuestionById(req: Request, res: Response) {
        // ID 4: Invalid input format
        if (!req.params || typeof req.params !== "object" || !("id" in req.params)) {
            res.status(400).json({ error_message: "Invalid input format, required question_id" });
            return;
        }

        const question_id = req.params.id;

        // ID 3: Empty question ID
        if (!question_id) {
            res.status(400).json({ error_message: "Question ID is required" });
            return;
        }

        try {
            const question = await this.questionService.getQuestionById(question_id);

            // ID 2: Question not found
            if (!question) {
                res.status(404).json({ error_message: "Question not found" });
                return;
            }

            // ID 1: Valid question ID — convert id to string for consistency
            res.status(200).json({
                ...question,
                id: question.id.toString(),
            });
        } catch {
            res.status(404).json({ error_message: "Question not found" });
        }
    }


    async getAQuestion(req: Request, res: Response) {
        try {
            const level = req.query.level as "Easy" | "Medium" | "Hard";
            if (!level) return res.status(400).json({ message: "Missing level" });

            const question = await this.questionService.getAQuestion(level);
            res.json(question);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error fetching question";
            res.status(404).json({ message });
        }
    }

    async createQuestion(req: Request, res: Response) {
        try {
            const newQuestion = await this.questionService.createQuestion(req.body);
            res.status(201).json(newQuestion);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error creating question";
            res.status(400).json({ message });
        }
    }

    async updateQuestion(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const updated = await this.questionService.updateQuestion(id, req.body);
            res.json(updated);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error updating question";
            res.status(400).json({ message });
        }
    }
}
