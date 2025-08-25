// backend\src\dtos\auth.dto.ts
import { PlayerResponse } from "./player.dto";

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface RegisterResponse {
  error_message: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  error_message: string | null;
  token: string | null;
  player_info: PlayerResponse | null;
}
