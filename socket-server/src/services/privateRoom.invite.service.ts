import { v4 as uuidv4 } from "uuid";

export class PrivateRoomInviteService {
    private inviteMap: Map<string, string> = new Map(); // inviteId -> roomId

    createInvite(roomId: string): string {
        const inviteId = uuidv4();
        this.inviteMap.set(inviteId, roomId);
        return inviteId;
    }

    getRoomId(inviteId: string): string | undefined {
        return this.inviteMap.get(inviteId);
    }

    removeInvite(inviteId: string): void {
        this.inviteMap.delete(inviteId);
    }

    removeInvitesForRoom(roomId: string): void {
        for (const [id, rid] of this.inviteMap.entries()) {
            if (rid === roomId) this.inviteMap.delete(id);
        }
    }
}
