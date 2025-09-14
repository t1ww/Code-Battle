// socket-server/src/handlers/terminal.handler.ts
import type { Server, Socket } from "socket.io";
import { TerminalService } from "@/services/terminal.service";

export function registerTerminalHandlers(io: Server, socket: Socket, terminalService: TerminalService) {
  
  // Start a new terminal session
  socket.on("terminal:start", async ({ code, sessionId }) => {
    try {
      const session = await terminalService.createSession(sessionId, code);
      socket.emit("terminal:started", { sessionId: session.sessionId });
    } catch (err: any) {
      socket.emit("terminal:error", { message: err.message || "Failed to start session" });
    }
  });

  // Send user input to terminal
  socket.on("terminal:input", async ({ sessionId, input }) => {
    try {
      const output = await terminalService.sendInput(sessionId, input);
      socket.emit("terminal:output", { sessionId, output });
    } catch (err: any) {
      socket.emit("terminal:error", { message: err.message || "Failed to send input" });
    }
  });

  // Stop and remove terminal session
  socket.on("terminal:stop", async ({ sessionId }) => {
    try {
      await terminalService.removeSession(sessionId);
      socket.emit("terminal:stopped", { sessionId });
    } catch (err: any) {
      socket.emit("terminal:error", { message: err.message || "Failed to stop session" });
    }
  });

  // Optional: cleanup on socket disconnect
  socket.on("disconnect", () => {
    for (const [sessionId] of terminalService["sessions"]) {
      // remove sessions belonging to this socket if you track ownership
      terminalService.removeSession(sessionId);
    }
  });
}
