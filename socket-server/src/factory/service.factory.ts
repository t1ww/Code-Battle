// socket-server\src\factory\service.factory.ts
import { Server } from "socket.io";

// services
import { ConnectionService } from "@/services/connection.service";
import { GameService } from "@/services/game.service";
import { MatchmakingService } from "@/services/matchmaking.service";
import { TeamService } from "@/services/team.service";
import { TeamInviteService } from "@/services/team.invite.service";
import { PrivateRoomService } from "@/services/privateRoom.service";
import { PrivateRoomInviteService } from "@/services/privateRoom.invite.service";
import { TerminalService } from "@/services/terminal.service";

export function createServices(io: Server) {
    const connectionService = new ConnectionService();
    const gameService = new GameService(io);
    const matchmakingService = new MatchmakingService(io, gameService);
    const teamService = new TeamService();
    const teamInviteService = new TeamInviteService();
    const privateRoomService = new PrivateRoomService(io, gameService);
    const privateRoomInviteService = new PrivateRoomInviteService();
    const terminalService = new TerminalService();

    return {
        connectionService,
        gameService,
        matchmakingService,
        teamService,
        teamInviteService,
        privateRoomService,
        privateRoomInviteService,
        terminalService,
    };
}
