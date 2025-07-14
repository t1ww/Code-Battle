import { Request, Response } from "express";
import { QuestionService } from "@/services/question.service";

export class QuestionController {
    private questionService = new QuestionService();

    async getQuestionById(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const question = await this.questionService.getQuestionById(id);
            res.json(question);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Question not found";
            res.status(404).json({ message });
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
