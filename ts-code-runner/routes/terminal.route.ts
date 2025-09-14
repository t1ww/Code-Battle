// ts-code-runner/src/routes/terminal.route.ts
import { Router } from "express";
import { TerminalService } from "../services/terminal.service.js";

const router = Router();
const terminalService = new TerminalService();

// Start a session
router.post("/start", async (req, res) => {
  const { code, sessionId } = req.body as { code: string; sessionId: string };
  const session = terminalService.createSession(sessionId, code);
  res.json({ sessionId, createdAt: session.createdAt });
});

// Send input to session
router.post("/input", async (req, res) => {
  const { sessionId, input } = req.body as { sessionId: string; input: string };
  const session = terminalService.getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  let output = "";
  session.process.stdout.once("data", (data) => (output += data.toString()));
  session.process.stderr.once("data", (data) => (output += data.toString()));

  session.process.stdin.write(input + "\n");
  res.json({ output });
});

// Stop session
router.post("/stop", async (req, res) => {
  const { sessionId } = req.body as { sessionId: string };
  terminalService.removeSession(sessionId);
  res.json({ success: true });
});

export default router;
