// ts-code-runner\routes\preview.route.ts
import { Router } from "express";
import fs from "fs-extra";
import path from "path";
import { TEMP_DIR } from "../config.js";
import { compileCode } from "../services/compile.service.js";
import { spawn } from "child_process";

const router = Router();

router.post("/start", async (req, res) => {
    const { code } = req.body as { code: string };
    const fileName = `interactive_${Date.now()}`;
    const cppFile = path.join(TEMP_DIR, `${fileName}.cpp`);
    const exeFile = path.join(TEMP_DIR, `${fileName}.exe`);

    await fs.ensureDir(TEMP_DIR);
    await fs.writeFile(cppFile, code);
    await compileCode(cppFile, exeFile);

    const child = spawn(exeFile, { stdio: ["pipe", "pipe", "pipe"] });

    // Map this process somewhere (e.g., in memory) using a session ID
    const sessionId = fileName;
    activeProcesses[sessionId] = child;

    res.json({ sessionId });
});

router.post("/input", (req, res) => {
    const { sessionId, input } = req.body as { sessionId: string; input: string };
    const child = activeProcesses[sessionId];
    if (!child) {
        res.status(404).json({ error: "Session not found" });
        return;
    }

    let output = "";
    child.stdout.once("data", (data: any) => (output += data.toString()));
    child.stderr.once("data", (data: any) => (output += data.toString()));

    child.stdin.write(input + "\n"); // feed input
    res.json({ output });
});

export default router;

// somewhere in memory
const activeProcesses: Record<string, any> = {};