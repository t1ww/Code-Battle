// backend/src/services/auth.service.ts
import { RegisterResponse, LoginResponse } from "@/dtos/auth.dto";
import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import ms from "ms";
import knex from "@/clients/knex.client";

const JWT_SECRET: Secret = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN: ms.StringValue =
  (process.env.JWT_EXPIRES_IN as ms.StringValue) || "1h";

export class AuthService {
  async register(
    username: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    if (!username || !email || !password) {
      return { error_message: "All fields are required." };
    }

    try {
      // Check for existing email
      const existingEmail = await knex("players").where({ email }).first();
      if (existingEmail) return { error_message: "Email already registered." };

      // Check for existing username
      const existingUsername = await knex("players")
        .where({ player_name: username })
        .first();
      if (existingUsername) return { error_message: "Username already taken." };

      const hashed = await bcrypt.hash(password, 10);

      // Insert new user
      await knex("players").insert({
        player_name: username,
        email,
        password_hash: hashed,
      });

      return { error_message: null };
    } catch (err) {
      return { error_message: "Registration failed: " + err };
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    if (!email || !password) {
      return { error_message: "All fields are required.", token: null, player_info: null };
    }

    try {
      const player = await knex("players").where({ email }).first();

      if (!player) {
        return { error_message: "Incorrect email or password.", token: null, player_info: null };
      }

      const match = await bcrypt.compare(password, player.password_hash);

      if (!match) {
        return { error_message: "Incorrect email or password.", token: null, player_info: null };
      }

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
        error_message: null,
        token,
        player_info: {
          id: player.player_id.toString(),
          username: player.player_name,
          email: player.email,
          created_at: new Date(player.created_at),
        },
      };
    } catch (err) {
      return {
        error_message: "Database unavailable. Please try again later.",
        token: null,
        player_info: null,
      };
    }
  }
}
