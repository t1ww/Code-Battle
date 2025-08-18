// socket-server/src/services/team.service.ts
import { PlayerSession, Team } from "@/types";
import { v4 as uuidv4 } from "uuid";

export class TeamService {
    private teams: Map<string, Team> = new Map();

    createTeam(players: PlayerSession[]): Team {
        const team_id = uuidv4();
        const team: Team = { team_id, players };
        this.teams.set(team_id, team);
        return team;
    }

    getTeam(team_id: string): Team | undefined {
        return this.teams.get(team_id);
    }

    removeTeam(team_id: string): void {
        this.teams.delete(team_id);
    }

    // NEW: find the team a socket belongs to
    getTeamBySocket(socket: any): Team | undefined {
        for (const team of this.teams.values()) {
            if (team.players.some(p => p.socket.id === socket.id)) {
                return team;
            }
        }
        return undefined;
    }

    // NEW: remove a player from a team by socket
    removePlayerBySocket(socket: any): { team: Team; playerId: string } | null {
        const team = this.getTeamBySocket(socket);
        if (!team) return null;

        const playerIndex = team.players.findIndex(p => p.socket.id === socket.id);
        if (playerIndex === -1) return null;

        const [removed] = team.players.splice(playerIndex, 1);
        return { team, playerId: removed.player_id };
    }
}
