import { Request, Response } from "express";
import { PlayerService } from "@/services/player.service";
import { PlayerResponse } from "@/dtos/player.dto";

const playerService = new PlayerService();

export const getProfile = async (req: Request, res: Response) => {
  if (!req.params || typeof req.params !== "object" || !("player_id" in req.params)) {
    res.status(400).json({ error_message: "Invalid input format, required player_id" });
    return;
  }

  const { player_id } = req.params;

  if (!player_id) {
    res.status(400).json({ error_message: "Player ID is required" });
    return;
  }

  const player: PlayerResponse | null = await playerService.getPlayerById(player_id);

  if (!player) {
    res.status(404).json({ error_message: "Player not found" });
    return;
  }

  // Convert Date to ISO string if needed
  const response = {
    ...player,
    created_at: player.created_at instanceof Date ? player.created_at.toISOString() : player.created_at,
  };

  res.status(200).json(response);
};
