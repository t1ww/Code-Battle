// backend\src\routes\question.route.ts
import { Router } from "express";
import { QuestionController } from "@/controllers/question.controller";

const router = Router();
const questionController = new QuestionController();

// Get
router.get("/", (req, res, next) => {
    questionController.getAQuestion(req, res).catch(next);
});
router.get("/three", (req, res, next) => {
    questionController.getThreeQuestions(req, res).catch(next);
});
router.get("/:id", (req, res, next) => {
    questionController.getQuestionById(req, res).catch(next);
});

// Post
router.post("/", (req, res, next) => {
    questionController.createQuestion(req, res).catch(next);
});

// Put
router.put("/:id", (req, res, next) => {
    questionController.updateQuestion(req, res).catch(next);
});


export default router;
