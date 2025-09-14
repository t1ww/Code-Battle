// ts-code-runner/src/services/terminal.service.ts
import { spawn, ChildProcessWithoutNullStreams } from "child_process";

interface TerminalSession {
  process: ChildProcessWithoutNullStreams;
  createdAt: Date;
  timeout?: NodeJS.Timeout;
}

export class TerminalService {
  private sessions = new Map<string, TerminalSession>();
  private SESSION_TTL = 5 * 60 * 1000; // 5 minutes

  createSession(sessionId: string, code: string): TerminalSession {
    const exeFile = `./tmp/${sessionId}.exe`;

    // spawn compile/run process
    const child = spawn("g++", ["-x", "c++", "-", "-o", exeFile]);

    const session: TerminalSession = { process: child, createdAt: new Date() };

    // setup automatic cleanup
    session.timeout = setTimeout(() => {
      this.removeSession(sessionId);
      console.log(`[TCR] Session ${sessionId} auto-removed after TTL`);
    }, this.SESSION_TTL);

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  removeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // kill process
    session.process.kill();

    // clear timeout if exists
    if (session.timeout) clearTimeout(session.timeout);

    this.sessions.delete(sessionId);
  }
}
