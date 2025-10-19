// ts-code-runner\src\services\execute.service.ts
import { spawn } from "child_process";
import { RUNTIME_TIMEOUT_MS, TEMP_DIR } from "@/config";
import type { TestCase, TestResult } from "@/types";

export function runCppTest(exeFile: string, tc: TestCase): Promise<TestResult> {
  return new Promise((resolve) => {
    const child = spawn(exeFile, [], { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let stderrOutput = "";
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, RUNTIME_TIMEOUT_MS);

    child.stdout.on("data", (d) => (output += String(d)));
    child.stderr.on("data", (d) => (stderrOutput += String(d)));

    child.on("close", (code) => {
      clearTimeout(timeoutId);
      output = output.trim();

      if (timedOut) {
        return resolve({ ...tc, output: "[Timeout]", passed: false });
      }
      if (code !== 0) {
        return resolve({
          ...tc,
          output: `[Runtime Error] ` + (stderrOutput.trim() || `Exited ${code}`),
          passed: false,
        });
      }

      const passed = output === tc.expected_output;
      resolve({ ...tc, output, passed });
    });

    if (child.stdin) {
      child.stdin.write(tc.input);
      child.stdin.end();
    }
  });
}

export function runJavaTest(className: string, tc: TestCase): Promise<TestResult> {
    return new Promise((resolve) => {
        const child = spawn("java", ["-cp", TEMP_DIR, className], { stdio: ["pipe", "pipe", "pipe"] });
        let output = "";
        let stderrOutput = "";
        let timedOut = false;

        const timeoutId = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, RUNTIME_TIMEOUT_MS);

        child.stdout.on("data", (d) => (output += String(d)));
        child.stderr.on("data", (d) => (stderrOutput += String(d)));

        child.on("close", (code) => {
            clearTimeout(timeoutId);
            output = output.trim();

            if (timedOut) return resolve({ ...tc, output: "[Timeout]", passed: false });
            if (code !== 0)
                return resolve({
                    ...tc,
                    output: `[Runtime Error] ` + (stderrOutput.trim() || `Exited ${code}`),
                    passed: false,
                });

            const passed = output === tc.expected_output;
            resolve({ ...tc, output, passed });
        });

        if (child.stdin) {
            child.stdin.write(tc.input);
            child.stdin.end();
        }
    });
}