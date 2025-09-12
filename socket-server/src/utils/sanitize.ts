// socket-server/src/utils/sanitize.ts
import type { Team } from "@/types";

export function sanitizeTeam(team: Team) {
  return {
    team_id: team.team_id,
    players: team.players.map(({ player_id, name, email }) => ({
      player_id,
      name,
      email,
    })),
  };
}

export function sanitizeRoom(room: { room_id: string; team1: Team | null; team2: Team | null }) {
  return {
    room_id: room.room_id,
    team1: room.team1 ? sanitizeTeam(room.team1) : undefined,
    team2: room.team2 ? sanitizeTeam(room.team2) : undefined,
  };
}

export function sanitizeRoomForUpdate(room: { team1: Team | null; team2: Team | null }) {
  return {
    team1: room.team1 ? sanitizeTeam(room.team1) : undefined,
    team2: room.team2 ? sanitizeTeam(room.team2) : undefined,
  };
}
