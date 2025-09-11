// backend/src/services/player.service.ts
import knex from "@/clients/knex.client";
import { PlayerResponse } from "../dtos/player.dto";
import { RegisterRequest, RegisterResponse } from "@/dtos/auth.dto";

export class PlayerService {
  async createPlayer(req: RegisterRequest): Promise<RegisterResponse> {
    const { username, email, password, confirm_password } = req;

    // ✅ UTC-11 ID 2: Empty fields
    if (!username || !email || !password || !confirm_password) {
      return { error_message: "All fields are required." };
    }

    try {
      const hashedPassword = password; // Assumes password already hashed upstream if needed

      // ✅ UTC-11 ID 1: Valid registration
      await knex("players").insert({
        player_name: username,
        email,
        password_hash: hashedPassword,
      });

      return { error_message: null };
    } catch (err) {
      return { error_message: "Failed to create player." };
    }
  }

  async getPlayerById(id: string): Promise<PlayerResponse | { error_message: string }> {
    // ✅ UTC-12 ID 3: Empty player ID
    if (!id) {
      return { error_message: "Player ID is required." };
    }

    const player = await knex("players")
      .select("player_id", "player_name as username", "email", "created_at")
      .where({ player_id: id })
      .first();

    // ✅ UTC-12 ID 2: Player not found
    if (!player) {
      return { error_message: "Player not found." };
    }

    // ✅ UTC-12 ID 1: Valid player ID
    return {
      id: player.player_id.toString(),
      username: player.username,
      email: player.email,
      created_at: new Date(player.created_at),
    };
  }

  async getPlayerByEmail(email: string): Promise<PlayerResponse | { error_message: string }> {
    // ✅ UTC-13 ID 4: Empty email
    if (!email) {
      return { error_message: "Email is required." };
    }

    // ✅ UTC-13 ID 3: Invalid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error_message: "Invalid email format." };
    }

    const player = await knex("players")
      .select("player_id", "player_name", "email", "created_at")
      .where({ email })
      .first();

    // ✅ UTC-13 ID 2: Email not registered
    if (!player) {
      return { error_message: "Player not found." };
    }

    // ✅ UTC-13 ID 1: Valid email
    return {
      id: player.player_id.toString(),
      username: player.player_name,
      email: player.email,
      created_at: new Date(player.created_at),
    };
  }
}
