import {
  RegisterResponse,
  LoginResponse,
} from "@/dtos/auth.dto";
import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import ms from "ms";
import pool from "@/clients/database.client";

const JWT_SECRET: Secret = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN: ms.StringValue =
  (process.env.JWT_EXPIRES_IN as ms.StringValue) || "1h";

export class AuthService {
  async register(
    username: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    // ✅ UTC-09 ID 3: Handle empty fields 
    if (!username || !email || !password) {
      return { error_message: "All fields are required" };
    }

    try {
      // ✅ UTC-09 ID 2: Check for existing email
      const [existing] = await pool.query(
        "SELECT id FROM players WHERE email = ? LIMIT 1",
        [email]
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return { error_message: "Email already registered" };
      }

      const hashed = await bcrypt.hash(password, 10);

      //✅ UTC-09 ID 1: Insert new user
      await pool.query(
        "INSERT INTO players (player_name, email, password_hash) VALUES (?, ?, ?)",
        [username, email, hashed]
      );

      return { error_message: null };
    } catch (err) {
      return { error_message: "Registration failed" };
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<{ errorMessage: string } | LoginResponse> {
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM players WHERE email = ?",
        [email]
      );
      if (!rows.length) return { errorMessage: "Player not found" };

      const player = rows[0];
      if (process.env.NODE_ENV !== "production") {
        console.log("Fetched user from DB:", player);
      }

      const match = await bcrypt.compare(password, player.password_hash);
      if (!match) return { errorMessage: "Invalid credentials" };

      const token = jwt.sign(
        {
          playerId: player.player_id,
          player_name: player.player_name,
          email: player.email,
          role: player.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        success: true,
        token,
        errorMessage: undefined,
        playerInfo: {
          id: player.player_id,
          username: player.player_name,
          email: player.email,
          createdAt: new Date(player.created_at),
        }
      };
    } catch (err) {
      console.error("Database error during login:", err);
      return { errorMessage: "Database unavailable. Please try again later." };
    }
  }
}
