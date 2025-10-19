// socket-server/src/handlers/terminal.handler.ts
import type { Server, Socket } from "socket.io";
import { TerminalService } from "@/services/terminal.service";

export function registerTerminalHandlers(io: Server, socket: Socket, terminalService: TerminalService) {
  // Start a terminal session (supports cpp/java)
  socket.on("terminal:start", ({ code, sessionId, selectedLanguage }: { code: string; sessionId: string; selectedLanguage: "cpp" | "java" }) => {
    terminalService.createSession(
      socket.id,
      sessionId,
      code,
      selectedLanguage, // now supporting multiple languages
      (output: string) => {
        socket.emit("terminal:output", { sessionId, output });
      }
    );

    socket.emit("terminal:started", { sessionId });
  });

  // Send input to running session
  socket.on("terminal:input", ({ sessionId, input }: { sessionId: string; input: string }) => {
    const session = terminalService.getSession(sessionId);
    if (!session) return;

    session.process.stdin.write(input + "\n");
  });

  // Cleanup on disconnect
  socket.on("disconnect", async () => {
    await terminalService.removeSessionsBySocket(socket.id);
  });
}
