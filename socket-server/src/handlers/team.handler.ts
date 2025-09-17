// socket-server/src/handlers/team.handler.ts
import type { Server, Socket } from "socket.io";
import type { PlayerSession } from "@/types";
import { sanitizeTeam } from "@/utils/sanitize";

export function registerTeamHandlers(io: Server, socket: Socket, services: any) {
    const { teamService, teamInviteService } = services;

    // ==== TEAM FORMATION EVENTS ====
    // Create a new team with players attached to current socket
    socket.on("createTeam", (players: PlayerSession[]) => {
        try {
            const playersWithSocket = players.map((p) => ({ ...p, socket }));
            const team = teamService.createTeam(playersWithSocket);
            const inviteId = teamInviteService.createInvite(team.team_id);
            socket.emit("teamCreated", {
                team_id: team.team_id,
                link: `/join/${inviteId}`, // frontend uses this now
            });
            socket.join(team.team_id);
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    // Join an existing team using an invite ID
    socket.on(
        "joinTeamWithInvite",
        ({
            invite_id,
            player,
        }: {
            invite_id: string;
            player: PlayerSession;
        }) => {
            const team_id = teamInviteService.getTeamId(invite_id);

            if (!team_id) {
                socket.emit("error", { error_message: "Invalid or expired invite" });
                return;
            }

            const team = teamService.getTeam(team_id);
            if (!team) {
                socket.emit("error", { error_message: "Team no longer exists" });
                return;
            }

            if (team.players.length >= 3) {
                socket.emit("error", { error_message: "Team is full" });
                return;
            }

            const alreadyJoined = team.players.some(
                (p: any) => p.player_id === player.player_id
            );
            if (alreadyJoined) {
                socket.emit("error", { error_message: "Player already in team" });
                return;
            }

            team.players.push({ ...player, socket });
            socket.join(team_id);

            io.to(team_id).emit("teamJoined", sanitizeTeam(team));
        }
    );

}
