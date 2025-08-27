// backend\src\routes\players.route.ts
import { Router } from "express";
import { register, login } from "@/controllers/auth.controller";
import { getProfile } from "@/controllers/player.controller";
import { authenticateToken } from "@/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);

export default router;
