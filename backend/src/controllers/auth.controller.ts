import { Request, Response } from "express";
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const result = await authService.register(name, email, password, role);
  res.json(result);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
};