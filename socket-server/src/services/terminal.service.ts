// socket-server/src/services/terminal.service.ts
import codeRunnerApi from "@/clients/coderunner.api";

interface TerminalSession {
  sessionId: string;
  createdAt: Date;
  socketId: string;
}

export class TerminalService {
  private sessions = new Map<string, TerminalSession>();

  async createSession(socketId: string, sessionId: string, code: string): Promise<TerminalSession> {
    await codeRunnerApi.post("/start", { code, sessionId });
    const session: TerminalSession = { sessionId, createdAt: new Date(), socketId };
    this.sessions.set(sessionId, session);
    return session;
  }

  async sendInput(sessionId: string, input: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");
    const { data } = await codeRunnerApi.post("/input", { sessionId, input });
    return data.output;
  }

  async removeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    await codeRunnerApi.post("/stop", { sessionId });
    this.sessions.delete(sessionId);
  }

  async removeSessionsBySocket(socketId: string) {
    const sessionsToRemove = Array.from(this.sessions.values())
      .filter(s => s.socketId === socketId)
      .map(s => s.sessionId);
    for (const id of sessionsToRemove) {
      await this.removeSession(id);
    }
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }
}
