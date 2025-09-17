// socket-server/src/factory/handlers.factory.ts
import { Server, Socket } from "socket.io";
import { Services } from "@/types";

import { registerConnectionHandlers } from "@/handlers/connection.handler";
import { registerTeamHandlers } from "@/handlers/team.handler";
import { registerMatchmakingHandlers } from "@/handlers/matchmaking.handler";
import { registerPrivateRoomHandlers } from "@/handlers/privateRoom.handler";
import { registerTerminalHandlers } from "@/handlers/terminal.handler";
import { registerGameHandlers } from "@/handlers/game.handler";

export function registerAllHandlers(io: Server, socket: Socket, services: Services) {
    registerConnectionHandlers(io, socket, services);
    registerTeamHandlers(io, socket, services);
    registerMatchmakingHandlers(io, socket, services);
    registerPrivateRoomHandlers(io, socket, services);
    registerTerminalHandlers(io, socket, services.terminalService);
    registerGameHandlers(io, socket, services.gameService);
}
