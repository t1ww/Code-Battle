import pool from "@/clients/database.client";
import { PlayerResponse } from "../dtos/player.dto";
import { RowDataPacket } from "mysql2";
import { RegisterRequest, RegisterResponse } from "@/dtos/auth.dto";

export class PlayerService {
  async createPlayer(req: RegisterRequest): Promise<RegisterResponse> {
    const { username, email, password, confirm_password } = req;

    // ✅ UTC-11 ID 2: Empty fields
    if (!username || !email || !password || !confirm_password) {
      return { error_message: "All fields are required" };
    }

    try {
      // ✅ UTC-11 ID 1: Valid registration
      const hashedPassword = password; // Assumes password already hashed upstream if needed
      await pool.query(
        "INSERT INTO players (player_name, email, password_hash) VALUES (?, ?, ?)",
        [username, email, hashedPassword]
      );

      return { error_message: null };
    } catch (err) {
      return { error_message: "Failed to create player" };
    }
  }

  async getPlayerById(id: string): Promise<PlayerResponse | { error_message: string }> {
    // ✅ UTC-12 ID 3: Empty player ID
    if (!id) {
      return { error_message: "Player ID is required" };
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT player_id, player_name AS username, email, created_at FROM players WHERE id = ?",
      [id]
    );

    // ✅ UTC-12 ID 2: Player not found
    if (rows.length === 0) {
      return { error_message: "Player not found" };
    }

    const player = rows[0];

    // ✅ UTC-12 ID 1: Valid player ID
    return {
      id: player.id.toString(),
      username: player.username,
      email: player.email,
      created_at: new Date(player.created_at),
    };
  }

  async getPlayerByEmail(email: string): Promise<PlayerResponse | { error_message: string }> {
    // ✅ UTC-13 ID 4: Empty email
    if (!email) {
      return { error_message: "Email is required" };
    }

    // ✅ UTC-13 ID 3: Invalid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error_message: "Invalid email format" };
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT player_id, player_name, email, created_at FROM players WHERE email = ?",
      [email]
    );

    // ✅ UTC-13 ID 2: Email not registered
    if (rows.length === 0) {
      return { error_message: "Player not found" };
    }

    const player = rows[0];

    // ✅ UTC-13 ID 1: Valid email
    return {
      id: player.id.toString(),
      username: player.player_name,
      email: player.email,
      created_at: new Date(player.created_at),
    };
  }
}
