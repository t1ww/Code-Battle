import { Router, Request, Response } from "express";
import pool from "@/database";
import { authenticateToken, AuthRequest } from "@/authMiddleware";

const router = Router();

// GET all answers
router.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const [rows] = await pool.query("SELECT * FROM answers");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// GET a single answer by id
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query("SELECT * FROM answers WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Answer not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// POST a new answer (authenticated)
router.post("/", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { question_id: questionId, answerCode, result } = req.body;
  // Assume that playerId is available from the token (set by your auth middleware)
  const playerId = req.player?.playerId;
  if (!playerId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [queryResult]: any = await pool.query(
      "INSERT INTO answers (questionId, playerId, answerCode, result) VALUES (?, ?, ?, ?)",
      [questionId, playerId, answerCode, result || null]
    );
    res.status(201).json({
      id: queryResult.insertId,
      questionId: questionId,
      playerId: playerId,
      answerCode,
      result: result || null,
      submittedAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create answer", details: (err as any).message });
  }
});

// Optionally, you can add endpoints for updating or deleting answers

export default router;
