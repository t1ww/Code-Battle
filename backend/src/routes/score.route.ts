import { Router, Request, Response, NextFunction } from "express";
import * as scoreController from "@/controllers/score.controller";

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
}

router.post("/submit", asyncHandler(scoreController.submitScore));
router.get("/leaderboard", asyncHandler(scoreController.getLeaderboard));
router.get("/topscore", asyncHandler(scoreController.getTopScore));

export default router;
