import pool from "@/clients/database.client";
import { PlayerResponse } from "../dtos/player.dto";
import { RowDataPacket } from "mysql2";

export class PlayerService {
  async createPlayer(username: string, email: string, hashedPassword: string): Promise<void> {
    await pool.query(
      "INSERT INTO players (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
  }

  async getPlayerById(id: string): Promise<PlayerResponse | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, username, email, created_at FROM players WHERE id = ?",
      [id]
    );

    if (rows.length === 0) return null;
    const player = rows[0];
    return {
      id: player.id,
      username: player.username,
      email: player.email,
      createdAt: player.created_at,
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
