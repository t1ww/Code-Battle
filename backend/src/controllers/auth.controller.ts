import { Request, Response } from "express";
import { AuthService } from "@/services/auth.service";
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "@/dtos/auth.dto";

export const authService = new AuthService();

export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response<RegisterResponse>
) => {
  // ✅ UTC-01 ID 6: Invalid input format
  if (
    !req.body ||
    typeof req.body !== "object" ||
    !("username" in req.body) ||
    !("email" in req.body) ||
    !("password" in req.body) ||
    !("confirm_password" in req.body)
  ) {
    res.status(400).json({ error_message: "Invalid RegisterRequest format" });
    return;
  }

  const { username, email, password, confirm_password } =
    req.body as RegisterRequest;

  // ✅ UTC-01 ID 5: Empty fields
  if (!username || !email || !password || !confirm_password) {
    res.status(400).json({ error_message: "All fields are required" });
    return;
  }

  // ✅ UTC-01 ID 2: Passwords do not match
  if (password !== confirm_password) {
    res.status(400).json({ error_message: "Passwords do not match" });
    return;
  }

  const result = await authService.register(username, email, password);

  // ✅ UTC-01 ID 3: Invalid email format
  // ✅ UTC-01 ID 4: Email already exists
  // (Both handled by `authService.register()` returning a non-null error_message)
  if (result.error_message) {
    res.status(400).json({ error_message: result.error_message });
    return;
  }

  // ✅ UTC-01 ID 1: Valid registration
  res.status(201).json({ error_message: null });
};


export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response<LoginResponse>
) => {
  // ✅ ID 5: Invalid input format
  if (
    !req.body ||
    typeof req.body !== "object" ||
    !("email" in req.body) ||
    !("password" in req.body)
  ) {
    res.status(400).json({
      error_message: "Invalid LoginRequest format",
      token: null,
      player_info: null,
    });
    return;
  }
  const { email, password } = req.body;

  // ✅ ID 4: Empty email or password
  if (!email || !password) {
    res.status(400).json({
      error_message: "All fields are required",
      token: null,
      player_info: null,
    });
    return;
  }

  const result = await authService.login(email, password);

  // ✅ ID 2 & 3: Wrong password or email not found
  if (result.error_message) {
    res.status(400).json({
      error_message: result.error_message,
      token: null,
      player_info: null,
    });
    return;
  }

  // ✅ ID 1: Valid login
  res.status(200).json({
    error_message: null,
    token: result.token,
    player_info: result.player_info,
  });
};
