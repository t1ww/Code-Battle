// ts-code-runner\src\services\compile.service.ts
import { exec } from "child_process";

const isWindows = process.platform === "win32";

export function compileCode(cppFile: string, exeFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const flag = isWindows ? "-mconsole" : "";
    const cmd = `g++ "${cppFile}" -o "${exeFile}" ${flag}`.trim();

    exec(cmd, (err, _stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve();
    });
  });
}
