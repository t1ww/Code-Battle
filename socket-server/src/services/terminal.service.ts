// socket-server/src/services/terminal.service.ts
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "fs";
import path from "path";

interface TerminalSession {
  sessionId: string;
  socketId: string;
  process: ChildProcessWithoutNullStreams;
}

export class TerminalService {
  private sessions = new Map<string, TerminalSession>();

  createSession(
    socketId: string,
    sessionId: string,
    code: string,
    selectedLanguage: "cpp" | "java",
    emitOutput: (output: string) => void
  ): TerminalSession {
    console.log(`🔹 TerminalService received code for session ${sessionId} (${selectedLanguage})`);

    const tmpDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    let compileProcess: ChildProcessWithoutNullStreams;
    let runProcess: ChildProcessWithoutNullStreams;
    let session: TerminalSession;

    if (selectedLanguage === "cpp") {
      const codeFile = path.join(tmpDir, `${sessionId}.cpp`);
      const binaryFile = path.join(tmpDir, `${sessionId}.out`);
      fs.writeFileSync(codeFile, code);

      // Compile C++
      compileProcess = spawn("g++", [codeFile, "-o", binaryFile]);
      compileProcess.stdout.on("data", (d) => emitOutput(d.toString()));
      compileProcess.stderr.on("data", (d) => emitOutput(`[Compilation Error] ${d.toString()}`));

      compileProcess.on("close", (codeExit) => {
        if (codeExit !== 0) {
          emitOutput("[Compilation Failed]");
          return;
        }
        emitOutput("[Compilation Success] Running program...");

        runProcess = spawn(binaryFile);
        runProcess.stdout.on("data", (d) => emitOutput(d.toString()));
        runProcess.stderr.on("data", (d) => emitOutput(`[Runtime Error] ${d.toString()}`));

        session = { sessionId, socketId, process: runProcess };
        this.sessions.set(sessionId, session);
      });

      return { sessionId, socketId, process: compileProcess }; // temp before compilation finishes

    } else if (selectedLanguage === "java") {
      // 1️⃣ Extract class name from code
      const match = code.match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      const className = match ? match[1] : `Main_${sessionId}`;

      const codeFile = path.join(tmpDir, `${className}.java`);
      fs.writeFileSync(codeFile, code);

      // 2️⃣ Compile
      compileProcess = spawn("javac", [codeFile]);
      compileProcess.stdout.on("data", (d) => emitOutput(d.toString()));
      compileProcess.stderr.on("data", (d) => emitOutput(`[Compilation Error] ${d.toString()}`));

      compileProcess.on("close", (codeExit) => {
        if (codeExit !== 0) {
          emitOutput("[Compilation Failed]");
          return;
        }
        emitOutput("[Compilation Success] Running program...");

        // 3️⃣ Run
        runProcess = spawn("java", ["-cp", tmpDir, className]);
        runProcess.stdout.on("data", (d) => emitOutput(d.toString()));
        runProcess.stderr.on("data", (d) => emitOutput(`[Runtime Error] ${d.toString()}`));

        session = { sessionId, socketId, process: runProcess };
        this.sessions.set(sessionId, session);
      });

      return { sessionId, socketId, process: compileProcess };
    }

    throw new Error(`Unsupported language: ${selectedLanguage}`);
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  removeSession(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    s.process.kill();
    this.sessions.delete(sessionId);
  }

  async removeSessionsBySocket(socketId: string) {
    const sessionsToRemove = Array.from(this.sessions.values())
      .filter((s) => s.socketId === socketId)
      .map((s) => s.sessionId);

    for (const id of sessionsToRemove) {
      const session = this.getSession(id);
      if (session) {
        session.process.kill();
        this.sessions.delete(id);
      }
    }
  }
}
