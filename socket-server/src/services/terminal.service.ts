// socket-server/src/services/terminal.service.ts
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "fs";
import path from "path";

// Interface representing a terminal session
interface TerminalSession {
  sessionId: string;
  socketId: string;
  process: ChildProcessWithoutNullStreams;
  cleanupFiles: () => void;
}

// Service handling terminal sessions
export class TerminalService {
  // Active sessions mapped by sessionId
  private sessions = new Map<string, TerminalSession>();

  // Create a new session, compile and run code
  createSession(
    socketId: string,
    sessionId: string,
    code: string,
    selectedLanguage: "cpp" | "java",
    emitOutput: (output: string) => void
  ): TerminalSession {
    console.log(`🔹 TerminalService received code for session ${sessionId} (${selectedLanguage})`);

    // Temp folder for code and binaries
    const tmpDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    let compileProcess: ChildProcessWithoutNullStreams;
    let runProcess: ChildProcessWithoutNullStreams;
    let session: TerminalSession;

    // Function to remove temporary files
    const cleanupFiles = (files: string[]) => {
      files.forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
    };

    if (selectedLanguage === "cpp") {
      // File paths for C++ code and binary
      const codeFile = path.join(tmpDir, `${sessionId}.cpp`);
      const binaryFile = path.join(tmpDir, `${sessionId}.out`);
      fs.writeFileSync(codeFile, code);

      // Compile C++ code
      compileProcess = spawn("g++", [codeFile, "-o", binaryFile]);
      compileProcess.stdout.on("data", (d) => emitOutput(d.toString()));
      compileProcess.stderr.on("data", (d) => emitOutput(`[Compilation Error] ${d.toString()}`));

      // On compile finish
      compileProcess.on("close", (codeExit) => {
        if (codeExit !== 0) {
          emitOutput("[Compilation Failed]");
          cleanupFiles([codeFile, binaryFile]);
          return;
        }

        emitOutput("[Compilation Success] Running program...");

        // Run compiled program
        runProcess = spawn(binaryFile);
        runProcess.stdout.on("data", (d) => emitOutput(d.toString()));
        runProcess.stderr.on("data", (d) => emitOutput(`[Runtime Error] ${d.toString()}`));

        // On program exit, cleanup files and session
        runProcess.on("close", () => {
          cleanupFiles([codeFile, binaryFile]);
          this.sessions.delete(sessionId);
        });

        session = { sessionId, socketId, process: runProcess, cleanupFiles: () => cleanupFiles([codeFile, binaryFile]) };
        this.sessions.set(sessionId, session);
      });

      return { sessionId, socketId, process: compileProcess, cleanupFiles: () => cleanupFiles([codeFile, binaryFile]) };

    } else if (selectedLanguage === "java") {
      // Extract class name and file paths for Java
      const match = code.match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      const className = match ? match[1] : `Main_${sessionId}`;
      const codeFile = path.join(tmpDir, `${className}.java`);
      const classFile = path.join(tmpDir, `${className}.class`);
      fs.writeFileSync(codeFile, code);

      // Compile Java code
      compileProcess = spawn("javac", [codeFile]);
      compileProcess.stdout.on("data", (d) => emitOutput(d.toString()));
      compileProcess.stderr.on("data", (d) => emitOutput(`[Compilation Error] ${d.toString()}`));

      // On compile finish
      compileProcess.on("close", (codeExit) => {
        if (codeExit !== 0) {
          emitOutput("[Compilation Failed]");
          cleanupFiles([codeFile, classFile]);
          return;
        }

        emitOutput("[Compilation Success] Running program...");

        // Run compiled Java program
        runProcess = spawn("java", ["-cp", tmpDir, className]);
        runProcess.stdout.on("data", (d) => emitOutput(d.toString()));
        runProcess.stderr.on("data", (d) => emitOutput(`[Runtime Error] ${d.toString()}`));

        // On program exit, cleanup files and session
        runProcess.on("close", () => {
          cleanupFiles([codeFile, classFile]);
          this.sessions.delete(sessionId);
        });

        session = { sessionId, socketId, process: runProcess, cleanupFiles: () => cleanupFiles([codeFile, classFile]) };
        this.sessions.set(sessionId, session);
      });

      return { sessionId, socketId, process: compileProcess, cleanupFiles: () => cleanupFiles([codeFile, classFile]) };
    }

    throw new Error(`Unsupported language: ${selectedLanguage}`);
  }

  // Get session by ID
  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  // Remove session and cleanup
  removeSession(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    s.process.kill();
    s.cleanupFiles?.();
    this.sessions.delete(sessionId);
  }

  // Remove all sessions associated with a socket
  async removeSessionsBySocket(socketId: string) {
    const sessionsToRemove = Array.from(this.sessions.values())
      .filter((s) => s.socketId === socketId)
      .map((s) => s.sessionId);

    for (const id of sessionsToRemove) {
      const session = this.getSession(id);
      if (session) {
        session.process.kill();
        session.cleanupFiles?.();
        this.sessions.delete(id);
      }
    }
  }
}