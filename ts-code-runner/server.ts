import cors from "cors";
import express from "express";
import fs from "fs-extra";
import path from "path";
import { exec, spawn } from "child_process";

import { fileURLToPath } from "url";
import { _parseDecimal } from "monaco-editor-vue3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

const TEMP_DIR = path.join(__dirname, "temp");
fs.ensureDirSync(TEMP_DIR);

app.post("/run", async (req, res): Promise<any> => {
    const { code, testCases, scorePct } = req.body;

    if (!code || !Array.isArray(testCases)) {
        return res.status(400).json({ error: "Invalid input" });
    }

    const scoreMultiplier = typeof scorePct === "number" ? scorePct : 1;

    const fileName = `temp_${Date.now()}`;
    const cppFilePath = path.join(TEMP_DIR, `${fileName}.cpp`);
    const exeFilePath = path.join(TEMP_DIR, fileName);

    try {
        await fs.writeFile(cppFilePath, code);

        await new Promise((resolve, reject) => {
            exec(`g++ "${cppFilePath}" -o "${exeFilePath}"`, (err, stdout, stderr) => {
                if (err) return reject(stderr || err.message);
                resolve(stdout);
            });
        });

        const results = await Promise.all(
            testCases.map(({ input, expectedOutput, score }: { input: string; expectedOutput: string; score: number }) => {
                return new Promise<{
                    input: string;
                    output: string;
                    expectedOutput: string;
                    passed: boolean;
                    score: number;
                }>((resolve) => {
                    const child = spawn(exeFilePath, []);
                    let output = "";

                    child.stdout.on("data", (data: Buffer) => {
                        output += data.toString();
                    });

                    child.stderr.on("data", (data: Buffer) => {
                        console.error(`stderr: ${data.toString()}`);
                    });

                    child.on("close", () => {
                        output = output.trim();
                        const passed = output === expectedOutput;
                        resolve({ input, output, expectedOutput, passed, score });
                    });

                    if (child.stdin) {
                        child.stdin.write(input);
                        child.stdin.end();
                    }
                });
            })
        );

        const totalScore = results.reduce((acc, test) => {
            return test.passed ? acc + test.score * scoreMultiplier : acc;
        }, 0);

        const allPassed = results.every((test) => test.passed);

        res.json({
            passed: allPassed,
            totalScore: totalScore.toFixed(3),
            results: results.map(({ passed, output, expectedOutput, input }) => ({
                passed,
                output,
                expectedOutput,
                input
            }))
        });

    } catch (error: unknown) {
        res.status(500).json({ error: (error as Error).toString() });
    } finally {
        fs.remove(cppFilePath).catch(() => { });
        fs.remove(exeFilePath).catch(() => { });
    }
});

app.listen(5001, () => console.log("Server running on port 5001"));
