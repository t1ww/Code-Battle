// ts-code-runner/src/services/terminal.service.ts
import { spawn, ChildProcessWithoutNullStreams } from "child_process";

interface TerminalSession {
  process: ChildProcessWithoutNullStreams;
  createdAt: Date;
}

export class TerminalService {
  private sessions = new Map<string, TerminalSession>();

  createSession(sessionId: string, code: string): TerminalSession {
    // write code to tmp file and compile
    const exeFile = `./tmp/${sessionId}.exe`;
    const child = spawn("g++", ["-x", "c++", "-", "-o", exeFile]);

    // optionally, handle stdout/stderr compilation here
    const session: TerminalSession = { process: child, createdAt: new Date() };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  removeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.process.kill();
      this.sessions.delete(sessionId);
    }
  }
}
