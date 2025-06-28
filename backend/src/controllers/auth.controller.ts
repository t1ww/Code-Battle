import { Request, Response, RequestHandler } from "express";
import { AuthService } from "@/services/auth.service";
import { RegisterRequest } from "@/dtos/auth.dto";

const authService = new AuthService();

export const register: RequestHandler = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body as RegisterRequest;

  if (password !== confirmPassword) {
    res.status(400).json({ errorMessage: "Passwords do not match" });
    return;
  }

  const result = await authService.register(username, email, password);
  if (result.errorMessage) {
    res.status(400).json({ errorMessage: result.errorMessage });
    return;
  }

  res.status(201).json(result);
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  if (result.errorMessage) {
    res.status(400).json({ errorMessage: result.errorMessage });
    return;
  }

  res.status(200).json(result);
};
