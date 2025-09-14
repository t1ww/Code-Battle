// socket-server/src/handlers/terminal.handler.ts
import type { Server, Socket } from "socket.io";
import { TerminalService } from "@/services/terminal.service";

export function registerTerminalHandlers(io: Server, socket: Socket, terminalService: TerminalService) {

  socket.on("terminal:start", async ({ code, sessionId }) => {
    try {
      const session = await terminalService.createSession(socket.id, sessionId, code);
      socket.emit("terminal:started", { sessionId: session.sessionId });
    } catch (err: any) {
      socket.emit("terminal:error", { message: err.message || "Failed to start session" });
    }
  });

  socket.on("terminal:input", async ({ sessionId, input }) => {
    try {
      const output = await terminalService.sendInput(sessionId, input);
      socket.emit("terminal:output", { sessionId, output });
    } catch (err: any) {
      socket.emit("terminal:error", { message: err.message || "Failed to send input" });
    }
  });

  socket.on("terminal:stop", async ({ sessionId }) => {
    try {
      await terminalService.removeSession(sessionId);
      socket.emit("terminal:stopped", { sessionId });
    } catch (err: any) {
      socket.emit("terminal:error", { message: err.message || "Failed to stop session" });
    }
  });

  socket.on("disconnect", async () => {
    // clean up all sessions for this socket only
    await terminalService.removeSessionsBySocket(socket.id);
  });
}
