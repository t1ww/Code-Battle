// frontend\code-battle\src\composables\useInteractiveTerminal.ts
import { ref } from "vue";
import codeRunnerApi from "@/clients/coderunner.api"; // your axios instance
import type CodeTerminal from "@/components/gameplay/CodeTerminal.vue";

export function useInteractiveTerminal() {
  const codeTerminal = ref<InstanceType<typeof CodeTerminal>>();
  const sessionId = ref<string | null>(null);

  const pushOutput = (msg: string) => {
    codeTerminal.value?.pushOutput(msg);
  };

  // Start a new interactive session
  const startSession = async (code: string) => {
    if (!code.trim()) return;
    pushOutput("Starting session...");

    try {
      const res = await codeRunnerApi.post("/start", { code });
      sessionId.value = res.data.sessionId;
      pushOutput(`Session started: ${sessionId.value}`);
    } catch (err: any) {
      pushOutput(`[Error] ${err.message || "Server error"}`);
    }
  };

  // Send user input to backend
  const sendInput = async (input: string) => {
    if (!sessionId.value) {
      pushOutput("[Error] No active session.");
      return;
    }
    pushOutput(`> ${input}`); // echo input

    try {
      const res = await codeRunnerApi.post("/input", {
        sessionId: sessionId.value,
        input,
      });
      const output = res.data.output as string;
      if (output) pushOutput(output);
    } catch (err: any) {
      pushOutput(`[Error] ${err.message || "Server error"}`);
    }
  };

  return { codeTerminal, pushOutput, startSession, sendInput };
}
