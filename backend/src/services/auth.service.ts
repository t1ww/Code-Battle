import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
} from "@/dtos/auth.dto";
import { PlayerResponse } from "@/dtos/player.dto";
import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import ms from "ms";
import pool from "@/clients/database.client";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "changeme";
const JWT_EXPIRES_IN: ms.StringValue =
  (process.env.JWT_EXPIRES_IN as ms.StringValue) || "1h";

export class AuthService {
  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<
    RegisterResponse & {
      id?: number;
      username?: string;
      email?: string;
    }
  > {
    if (!username || !email || !password) {
      return { errorMessage: "Missing required fields" };
    }

    const hashed = await bcrypt.hash(password, 10);

    try {
      const [result] = await pool.query(
        "INSERT INTO players (player_name, email, password_hash) VALUES (?, ?, ?)",
        [username, email, hashed, "student"]
      );

      return { id: (result as any).insertId, username, email };
    } catch (err) {
      return { errorMessage: (err as Error).message };
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<(LoginResponse & PlayerResponse) | LoginResponse> {
    const [rows]: any = await pool.query(
      "SELECT * FROM players WHERE email = ?",
      [email]
    );
    if (!rows.length) return { errorMessage: "Player not found" };

    const player = rows[0];
    const match = await bcrypt.compare(password, player.password);
    if (!match) return { errorMessage: "Invalid credentials" };

    const token = jwt.sign(
      {
        playerId: player.id,
        player_name: player.player_name,
        email: player.email,
        role: player.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      errorMessage: undefined,
      id: player.id,
      username: player.player_name,
      email: player.email,
      createdAt: new Date(player.created_at),
    };
  }
}
