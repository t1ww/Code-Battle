// ts-code-runner\config.ts
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TEMP_DIR = path.join(__dirname, "temp");
export const RUNTIME_TIMEOUT_MS = 3000;
