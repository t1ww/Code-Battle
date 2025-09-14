// socket-server/src/handlers/terminal.handler.ts
import type { Server, Socket } from "socket.io";
import { TerminalService } from "@/services/terminal.service";

export function registerTerminalHandlers(io: Server, socket: Socket, terminalService: TerminalService) {
  socket.on("terminal:start", ({ code, sessionId }) => {
    terminalService.createSession(socket.id, sessionId, code, (output: string) => {
      socket.emit("terminal:output", { sessionId, output });
    });

    socket.emit("terminal:started", { sessionId });
  });

  socket.on("terminal:input", ({ sessionId, input }) => {
    const session = terminalService.getSession(sessionId);
    if (!session) return;

    session.process.stdin.write(input + "\n");
  });

  socket.on("disconnect", async () => {
    await terminalService.removeSessionsBySocket(socket.id);
  });
}
