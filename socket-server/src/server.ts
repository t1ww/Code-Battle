// socket-server/src/server.ts
import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";

// services
import { ConnectionService } from "@/services/connection.service";
import { MatchmakingService } from "@/services/matchmaking.service";
import { TeamService } from "@/services/team.service";
import { TeamInviteService } from "@/services/team.invite.service";
import { PrivateRoomService } from "@/services/privateRoom.service";
import { PrivateRoomInviteService } from "@/services/privateRoom.invite.service";
import { TerminalService } from "@/services/terminal.service";

// handlers
import { registerConnectionHandlers } from "@/handlers/connection.handler";
import { registerTeamHandlers } from "@/handlers/team.handler";
import { startMatchmakingLoop, registerMatchmakingHandlers } from "@/handlers/matchmaking.handler";
import { registerPrivateRoomHandlers } from "@/handlers/privateRoom.handler";
import { registerTerminalHandlers } from "@/handlers/terminal.handler";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// initialize services
const services = {
    connectionService: new ConnectionService(),
    matchmakingService: new MatchmakingService(io),
    teamService: new TeamService(),
    teamInviteService: new TeamInviteService(),
    privateRoomService: new PrivateRoomService(io),
    privateRoomInviteService: new PrivateRoomInviteService(),
    terminalService: new TerminalService(),
};

// MM matching loop
startMatchmakingLoop(services);
// Socket.on connections
io.on("connection", (socket) => {
    registerConnectionHandlers(io, socket, services);
    registerTeamHandlers(io, socket, services);
    registerMatchmakingHandlers(io, socket, services);
    registerPrivateRoomHandlers(io, socket, services);
    registerTerminalHandlers(io, socket, services.terminalService);
});

server.listen(3001, () => console.log("Socket server running on port 3001"));
