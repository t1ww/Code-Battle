// ts-code-runner\services\compile.service.ts
import { exec } from "child_process";

export function compileCode(cppFile: string, exeFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`g++ "${cppFile}" -o "${exeFile}" -mconsole`, (err, _stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve();
    });
  });
}
