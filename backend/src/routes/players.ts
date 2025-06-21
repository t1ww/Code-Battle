import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "@/authMiddleware";
import pool from "@/database";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
import ms from "ms";

const router = Router();
dotenv.config();

// Get all players (for testing purposes)
router.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const [rows] = await pool.query("SELECT * FROM players");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/profile", authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: "Profile data", player: req.player });
});

// Add a new player (Register)
router.post("/register", async (req: Request, res: Response): Promise<any> => {
  const { name, email, password, role } = req.body;
  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    // Default role to "student" if not provided
    const playerRole = role || "student";

    const [result] = await pool.query(
      "INSERT INTO players (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, playerRole]
    );

    res.status(201).json({ id: (result as any).insertId, name, email, role: playerRole });
  } catch (err) {
    const error = err as { message: string };
    console.error("Database Error:", error.message);
    res.status(500).json({ error: "Failed to add player", details: error.message });
  }
});

// Login route
router.post("/login", async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {
    // Query player by email
    const [rows]: any = await pool.query("SELECT * FROM players WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: "player not found" });
    }
    const player = rows[0];

    // Compare password with stored hash
    const match = await bcrypt.compare(password, player.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT Token
    const secretKey = process.env.JWT_SECRET;
    const expiresInEnv = process.env.JWT_EXPIRES_IN;
    if (!secretKey) {
      return res.status(500).json({ error: "Missing JWT_SECRET in environment variables" });
    }

    // Provide a fallback value ("1h") for expiresIn and convert it to milliseconds
    const expiresInValue: ms.StringValue = (expiresInEnv || "1h") as ms.StringValue;
    const expiresInMs = ms(expiresInValue);
    if (typeof expiresInMs !== "number") {
      return res.status(500).json({ error: "Invalid expiresIn value" });
    }

    const signOptions: SignOptions = { expiresIn: expiresInMs };

    // Include role in the token payload
    const token = jwt.sign(
      { playerId: player.id, name: player.name, email: player.email, role: player.role },
      secretKey,
      signOptions
    );

    res.status(200).json({
      message: "Login successful",
      token,
      playerId: player.id,
      name: player.name,
      email: player.email,
      role: player.role
    });

  } catch (err) {
    console.error("Database Error:", (err as any).message);
    return res.status(500).json({ error: "Login failed", details: (err as any).message });
  }
});

export default router;
