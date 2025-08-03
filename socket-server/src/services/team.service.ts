import { Team, TeamPlayer } from "@/types";
import { v4 as uuidv4 } from "uuid";

export class TeamService {
    private teams: Map<string, Team> = new Map();

    createTeam(players: TeamPlayer[]): Team {
        const team_id = uuidv4();
        const team: Team = {
            team_id,
            players,
        };

        this.teams.set(team_id, team);
        return team;
    }

    getTeam(team_id: string): Team | undefined {
        return this.teams.get(team_id);
    }

    removeTeam(team_id: string): void {
        this.teams.delete(team_id);
    }
}
