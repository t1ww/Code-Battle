import { Router } from "express";
import { register, login } from "@/controllers/auth.controller";
import { getProfile } from "@/controllers/player.controller";
import { authenticateToken } from "@/authMiddleware";

const router = Router();

router.get("/", async (req, res) => {
  // (optional) keep testing route or remove
  res.json({ message: "Player route root" });
});

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);

export default router;
