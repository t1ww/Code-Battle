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

  createSession(socketId: string, sessionId: string, code: string, emitOutput: (output: string) => void): TerminalSession {
    // Log received code
    console.log(`🔹 TerminalService received code for session ${sessionId} from socket ${socketId}:`);
    console.log(code);

    // 1️⃣ Write code to a temporary file
    const tmpDir = "/tmp/code-battle";
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const codeFile = path.join(tmpDir, `${sessionId}.cpp`);
    fs.writeFileSync(codeFile, code);

    const binaryFile = path.join(tmpDir, `${sessionId}.out`);

    // 2️⃣ Compile the C++ code
    const compile = spawn("g++", [codeFile, "-o", binaryFile]);

    compile.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`📄 [stdout] ${output}`);
      emitOutput(output);
    });
    compile.stderr.on("data", (data) => {
      const error = data.toString();
      console.log(`❌ [stderr] ${error}`);
      emitOutput(`[Compilation Error] ${error}`);
    });

    compile.on("close", (codeExit) => {
      console.log(`🔹 Compilation process exited with code ${codeExit}`);
      if (codeExit !== 0) {
        emitOutput("[Compilation Failed]");
        return;
      }

      emitOutput("[Compilation Success] Running program...");

      // 3️⃣ Run the compiled binary
      const runProcess = spawn(binaryFile);

      runProcess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`📤 [program stdout] ${output}`);
        emitOutput(output);
      });
      runProcess.stderr.on("data", (data) => {
        const error = data.toString();
        console.log(`📤 [program stderr] ${error}`);
        emitOutput(`[Runtime Error] ${error}`);
      });

      // 4️⃣ Save the running process to session
      const session: TerminalSession = { sessionId, socketId, process: runProcess };
      this.sessions.set(sessionId, session);
    });

    return { sessionId, socketId, process: compile }; // temporary until compiled
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
      .filter(s => s.socketId === socketId)
      .map(s => s.sessionId);

    for (const id of sessionsToRemove) {
      const session = this.getSession(id);
      if (session) {
        session.process.kill();
        this.sessions.delete(id);
      }
    }
  }
}
