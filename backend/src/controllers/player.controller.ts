import { Request, Response } from "express";
import { AuthRequest } from "@/authMiddleware";

export const getProfile = (req: AuthRequest, res: Response) => {
  res.json({ message: "Profile data", player: req.player });
};
