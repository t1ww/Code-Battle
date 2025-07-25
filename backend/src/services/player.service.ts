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
      "SELECT id, player_name AS username, email, created_at FROM players WHERE id = ?",
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

  async getPlayerByEmail(email: string): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM players WHERE email = ?",
      [email]
    );
    return rows.length ? rows[0] : null;
  }
}
