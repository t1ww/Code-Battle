// socket-server/src/services/terminal.service.ts
import fetch from "node-fetch";

interface TerminalSession {
  sessionId: string;
  createdAt: Date;
}

export class TerminalService {
  private sessions = new Map<string, TerminalSession>();
  private tcrBase = "http://localhost:5000/terminal";

  async createSession(sessionId: string, code: string): Promise<TerminalSession> {
    const res = await fetch(`${this.tcrBase}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, sessionId }),
    });
    const data = await res.json();

    const session: TerminalSession = { sessionId, createdAt: new Date() };
    this.sessions.set(sessionId, session);
    return session;
  }

  async sendInput(sessionId: string, input: string): Promise<string> {
    if (!this.sessions.has(sessionId)) throw new Error("Session not found");

    const res = await fetch(`${this.tcrBase}/input`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, input }),
    });
    const data = await res.json();
    return data.output;
  }

  async removeSession(sessionId: string) {
    if (!this.sessions.has(sessionId)) return;

    await fetch(`${this.tcrBase}/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    this.sessions.delete(sessionId);
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }
}
