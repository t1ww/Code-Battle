// frontend\code-battle\src\composables\useTerminal.ts
import { ref } from "vue";
import type CodeTerminal from "@/components/gameplay/CodeTerminal.vue";
import { io, Socket } from "socket.io-client";

export function useTerminal() {
  const codeTerminal = ref<InstanceType<typeof CodeTerminal>>();
  const sessionId = ref<string | null>(null);
  const socket = ref<Socket | null>(io("http://localhost:3001")); // socket-server

  const pushOutput = (msg: string) => {
    codeTerminal.value?.pushOutput(msg);
  };

  // Start a session
  const startSession = (code: string) => {
    if (!socket.value || !code.trim()) return;

    pushOutput("Starting session...");
    sessionId.value = `sess_${Date.now()}`;

    socket.value.emit("terminal:start", { code, sessionId: sessionId.value });

    socket.value.once("terminal:started", (data: { sessionId: string }) => {
      pushOutput(`Session started: ${data.sessionId}`);
    });

    socket.value.once("terminal:error", (err: { message: string }) => {
      pushOutput(`[Error] ${err.message}`);
    });
  };

  // Send input
  const sendInput = (input: string) => {
    if (!socket.value || !sessionId.value) return;
    pushOutput(`> ${input}`);

    socket.value.emit("terminal:input", { sessionId: sessionId.value, input });

    socket.value.once("terminal:output", (data: { sessionId: string; output: string }) => {
      if (data.output) pushOutput(data.output);
    });

    socket.value.once("terminal:error", (err: { message: string }) => {
      pushOutput(`[Error] ${err.message}`);
    });
  };

  // Stop session
  const stopSession = () => {
    if (!socket.value || !sessionId.value) return;

    socket.value.emit("terminal:stop", { sessionId: sessionId.value });

    socket.value.once("terminal:stopped", (data: { sessionId: string }) => {
      pushOutput(`Session stopped: ${data.sessionId}`);
      sessionId.value = null;
    });
  };

  return { codeTerminal, pushOutput, startSession, sendInput, stopSession };
}
