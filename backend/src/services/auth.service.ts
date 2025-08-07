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
      // Check for existing email
      const [existingEmail] = await pool.query(
        "SELECT player_id FROM players WHERE email = ? LIMIT 1",
        [email]
      );
      if (Array.isArray(existingEmail) && existingEmail.length > 0) {
        return { error_message: "Email already registered" };
      }

      // Check for existing username
      const [existingUsername] = await pool.query(
        "SELECT player_id FROM players WHERE player_name = ? LIMIT 1",
        [username]
      );
      if (Array.isArray(existingUsername) && existingUsername.length > 0) {
        return { error_message: "Username already taken" };
      }

      const hashed = await bcrypt.hash(password, 10);

      //✅ UTC-09 ID 1: Insert new user
      await pool.query(
        "INSERT INTO players (player_name, email, password_hash) VALUES (?, ?, ?)",
        [username, email, hashed]
      );

      return { error_message: null };
    } catch (err) {
      return { error_message: "Registration failed: " + err };
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    // ✅ UTC-10 ID 4: Empty fields
    if (!email || !password) {
      return { error_message: "All fields are required", token: null, player_info: null };
    }

    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM players WHERE email = ?",
        [email]
      );

      // ✅ UTC-10 ID 3: Email not found
      if (!rows.length) {
        return { error_message: "Incorrect email or password", token: null, player_info: null };
      }

      const player = rows[0];

      const match = await bcrypt.compare(password, player.password_hash);

      // ✅ UTC-10 ID 2: Wrong password
      if (!match) {
        return { error_message: "Incorrect email or password", token: null, player_info: null };
      }

      // ✅ UTC-10 ID 1: Valid login
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
