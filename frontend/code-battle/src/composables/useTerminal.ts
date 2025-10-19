// frontend/code-battle/src/composables/useTerminal.ts
import { ref } from "vue";
import type CodeTerminal from "@/components/gameplay/CodeTerminal.vue";
import { socket } from "@/clients/socket.api";

export function useTerminal() {
  const codeTerminal = ref<InstanceType<typeof CodeTerminal>>();
  const sessionId = ref<string | null>(null);

  const pushOutput = (msg: string) => {
    codeTerminal.value?.pushOutput(msg);
  };

  // Ensure the socket is connected
  const connectSocket = () => {
    if (!socket.connected) socket.connect();

    // Continuous listening for outputs/errors
    socket.off("terminal:output");
    socket.on("terminal:output", (data: { sessionId: string; output: string }) => {
      if (data.sessionId === sessionId.value && data.output) pushOutput(data.output);
    });

    socket.off("terminal:error");
    socket.on("terminal:error", (err: { message: string }) => {
      pushOutput(`[Error] ${err.message}`);
    });
  };

  const startSession = (code: string, selectedLanguage: string) => {
    if (!code.trim()) return;
    connectSocket();

    pushOutput("Starting session...");
    sessionId.value = `sess_${Date.now()}`;

    socket.emit("terminal:start", { code, selectedLanguage, sessionId: sessionId.value });
    socket.once("terminal:started", (data: { sessionId: string }) => {
      pushOutput(`Session started: ${data.sessionId}`);
    });
  };

  const sendInput = (input: string) => {
    if (!sessionId.value) return;
    pushOutput(`> ${input}`);
    socket.emit("terminal:input", { sessionId: sessionId.value, input });
  };

  const stopSession = () => {
    if (!sessionId.value) return;
    socket.emit("terminal:stop", { sessionId: sessionId.value });
    pushOutput("> Session stopped.");
    sessionId.value = null;
  };

  return { codeTerminal, pushOutput, startSession, sendInput, stopSession };
}
