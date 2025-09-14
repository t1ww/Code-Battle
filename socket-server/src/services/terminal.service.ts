// socket-server/src/services/terminal.service.ts
import fetch from "node-fetch";

interface TerminalSession {
  sessionId: string;
  createdAt: Date;
  socketId: string; // track which socket owns this session
}

export class TerminalService {
  private sessions = new Map<string, TerminalSession>();
  private tcrBase = "http://localhost:5000/terminal";

  async createSession(socketId: string, sessionId: string, code: string): Promise<TerminalSession> {
    const res = await fetch(`${this.tcrBase}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, sessionId }),
    });
    const data = await res.json();

    const session: TerminalSession = { sessionId, createdAt: new Date(), socketId };
    this.sessions.set(sessionId, session);
    return session;
  }

  async sendInput(sessionId: string, input: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    const res = await fetch(`${this.tcrBase}/input`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, input }),
    });
    const data = await res.json();
    return data.output;
  }

  async removeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    await fetch(`${this.tcrBase}/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    this.sessions.delete(sessionId);
  }

  // cleanup all sessions for a socket
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
