// socket-server/src/services/team.invite.service.ts
import { v4 as uuidv4 } from "uuid";

export class TeamInviteService {
    private inviteMap: Map<string, string> = new Map(); // inviteId -> teamId

    createInvite(teamId: string): string {
        const inviteId = uuidv4();
        this.inviteMap.set(inviteId, teamId);
        return inviteId;
    }

    getTeamId(inviteId: string): string | undefined {
        return this.inviteMap.get(inviteId);
    }

    removeInvite(inviteId: string): void {
        this.inviteMap.delete(inviteId);
    }

    removeInvitesForTeam(teamId: string): void {
        for (const [id, tid] of this.inviteMap.entries()) {
            if (tid === teamId) this.inviteMap.delete(id);
        }
    }
}
