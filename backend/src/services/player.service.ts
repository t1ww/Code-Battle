// backend\src\services\player.service.ts
import knex from "@/clients/knex.client";
import { PlayerResponse } from "@/dtos/player.dto";
import { RegisterRequest, RegisterResponse } from "@/dtos/auth.dto";
import { withRetry } from "@/utils/withRetry";
import { getErrorMessage } from "@/utils/errorUtils";

export class PlayerService {
  async createPlayer(req: RegisterRequest): Promise<RegisterResponse> {
    const { username, email, password, confirm_password } = req;

    if (!username || !email || !password || !confirm_password) {
      return { error_message: "All fields are required." };
    }

    try {
      const hashedPassword = password; // Assumes password already hashed upstream

      await withRetry(() =>
        knex("players").insert({
          player_name: username,
          email,
          password_hash: hashedPassword,
        })
      );

      return { error_message: null };
    } catch (err) {
      console.error("createPlayer error:", getErrorMessage(err));
      return { error_message: "Failed to create player." };
    }
  }

  async getPlayerById(id: string): Promise<PlayerResponse | { error_message: string }> {
    if (!id) {
      return { error_message: "Player ID is required." };
    }

    try {
      const player = await withRetry(() =>
        knex("players")
          .select("player_id", "player_name as username", "email", "created_at")
          .where({ player_id: id })
          .first()
      );

      if (!player) {
        return { error_message: "Player not found." };
      }

      return {
        id: player.player_id.toString(),
        username: player.username,
        email: player.email,
        created_at: new Date(player.created_at),
      };
    } catch (err) {
      console.error("getPlayerById error:", getErrorMessage(err));
      return { error_message: "Error fetching player." };
    }
  }

  async getPlayerByEmail(email: string): Promise<PlayerResponse | { error_message: string }> {
    if (!email) {
      return { error_message: "Email is required." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error_message: "Invalid email format." };
    }

    try {
      const player = await withRetry(() =>
        knex("players")
          .select("player_id", "player_name", "email", "created_at")
          .where({ email })
          .first()
      );

      if (!player) {
        return { error_message: "Player not found." };
      }

      return {
        id: player.player_id.toString(),
        username: player.player_name,
        email: player.email,
        created_at: new Date(player.created_at),
      };
    } catch (err) {
      console.error("getPlayerByEmail error:", getErrorMessage(err));
      return { error_message: "Error fetching player." };
    }
  }
}
