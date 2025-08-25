// backend\src\routes\question.route.ts
import { Router } from "express";
import { QuestionController } from "@/controllers/question.controller";

const router = Router();
const questionController = new QuestionController();

router.get("/:id", (req, res, next) => {
    questionController.getQuestionById(req, res).catch(next);
});
router.get("/", (req, res, next) => {
    questionController.getAQuestion(req, res).catch(next);
});
router.post("/", (req, res, next) => {
    questionController.createQuestion(req, res).catch(next);
});
router.put("/:id", (req, res, next) => {
    questionController.updateQuestion(req, res).catch(next);
});

export default router;
