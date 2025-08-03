import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { ConnectionService } from "@/services/connection.service";
import { MatchmakingService } from "@/services/matchmaking.service";
import { TeamService } from "./services/team.service";
import { InviteService } from "@/services/invite.service";
import { MatchMode, QueuedPlayer, QueuePlayerData, QueuePlayerData1v1, QueuePlayerData3v3, Team, TeamPlayer } from "@/types";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const connectionService = new ConnectionService();
const matchmakingService = new MatchmakingService();
const teamService = new TeamService();
const inviteService = new InviteService();

// Helper
function sanitizeTeam(team: Team) {
    return {
        team_id: team.team_id,
        players: team.players.map(({ player_id, name, email }) => ({ player_id, name, email }))
    }
}


// ✅ Start match (matching) loop every 6 seconds
setInterval(() => {
    ['1v1', '3v3'].forEach(mode => {
        console.log(`Attempt starting match for ${mode}`);
        matchmakingService.startMatch(mode as MatchMode);
    });
}, 6000);

io.on("connection", (socket) => {
    // ✅ Handle new socket connection
    connectionService.handleConnect(socket);

    // ✅ Handle socket disconnect
    socket.on("disconnect", () => {
        connectionService.handleDisconnect(socket.id);
    });

    // ✅ Team formation: Create a new team
    socket.on("createTeam", (players: TeamPlayer[]) => {
        try {
            // Attach current socket reference to each player
            const playersWithSocket = players.map(p => ({ ...p, socket }));
            // Create team via TeamService
            const team = teamService.createTeam(playersWithSocket);
            const inviteId = inviteService.createInvite(team.team_id);
            socket.emit("teamCreated", {
                team_id: team.team_id,
                link: `/join/${inviteId}` // frontend uses this now
            });
        } catch (err: any) {
            socket.emit("error", { error_message: err.message });
        }
    });

    // ✅ Team formation: Join existing team by team ID
    socket.on("joinTeamWithInvite", ({ invite_id, player }: { invite_id: string, player: TeamPlayer }) => {
        const team_id = inviteService.getTeamId(invite_id);

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

        // Duplicate check here as well
        const alreadyJoined = team.players.some(p => p.player_id === player.player_id);
        if (alreadyJoined) {
            socket.emit("error", { error_message: "Player already in team" });
            return;
        }

        team.players.push({ ...player, socket });
        socket.join(team_id);

        io.to(team_id).emit("teamJoined", sanitizeTeam(team));
    });

    // ✅ Matchmaking: Queue a single player for 1v1 or team for 3v3
    socket.on("queuePlayer", (data: QueuePlayerData) => {
        const mode = data.mode || "1v1";

        if (mode === "1v1" && "player_id" in data) {
            const playerData = data as QueuePlayerData1v1;
            console.log(`Queuing player for 1v1: ${playerData.name}`);
            const player: QueuedPlayer = {
                player_id: playerData.player_id,
                name: playerData.name,
                email: playerData.email,
                socket,
            };

            const result = matchmakingService.queuePlayer(player, mode);
            socket.emit("queueResponse", result);
        } else if (mode === "3v3" && "team_id" in data && Array.isArray(data.players)) {
            // Cast to 3v3 team data
            const teamData = data as QueuePlayerData3v3;

            const team: Team = {
                team_id: teamData.team_id,
                players: teamData.players.map(p => ({
                    player_id: p.player_id,
                    name: p.name,
                    email: p.email,
                    socket,
                })),
            };

            const result = matchmakingService.queuePlayer(team, mode);
            socket.emit("queueResponse", result);
        }
    });

    // ✅ Matchmaking: Queue an existing team by team ID
    socket.on("queueTeam", ({ team_id, mode }: { team_id: string, mode: MatchMode }) => {
        const team = teamService.getTeam(team_id);
        if (!team) {
            socket.emit("queueResponse", { error_message: "Team not found" });
            return;
        }
        const result = matchmakingService.queuePlayer(team, mode);
        socket.emit("queueResponse", result);
    });

    // ✅ Matchmaking: Start a match manually (fallback or test)
    socket.on("startMatch", (data: { mode?: MatchMode }) => {
        const mode = data?.mode || "1v1"; // default to 1v1 if not specified
        const result = matchmakingService.startMatch(mode);
        socket.emit("matchResponse", result);
    });
});

const PORT = 3001;
// ✅ Start server listening on PORT
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
