import { PlayerResponse } from "./player.dto";

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  errorMessage?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  token?: string;
  errorMessage?: string;
  playerInfo: PlayerResponse;
}
