import { Request, Response } from "express";
import { AuthService } from "@/services/auth.service";
import { RegisterRequest } from "@/dtos/auth.dto";

export const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  const { username, email, password, confirmPassword } =
    req.body as RegisterRequest;

  if (password !== confirmPassword) {
    res.status(400).json({ errorMessage: "Passwords do not match" });
    return;
  }

  const result = await authService.register(username, email, password);

  if (result.errorMessage) {
    res.status(400).json({ errorMessage: result.errorMessage });
    return;
  }

  res.status(201).json({
    success: true,
    errorMessage: null,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  if (result.errorMessage) {
    res.status(400).json({ errorMessage: result.errorMessage });
    return;
  }

  const { token, ...playerInfo } = result;

  res.status(200).json({
    success: true,
    token,
    playerInfo,
    errorMessage: null,
  });
};
