import cors from "cors";
import express from "express";
import fs from "fs-extra";
import path from "path";
import { exec, spawn } from "child_process";
import { fileURLToPath } from "url";

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
    const { code, test_cases: test_cases, score_pct } = req.body;

    if (!Array.isArray(test_cases)) {
        return res.status(400).json({ error: "Invalid input" });
    }
    if (!code || !code.trim()) {
        const results = test_cases.map(({ input, expected_output, score }) => ({
            input,
            output: "",
            expected_output,
            passed: false,
            score
        }));

        const total_score = 0;

        return res.json({
            passed: false,
            total_score,
            results
        });
    }

    const scoreMultiplier = typeof score_pct === "number" ? score_pct : 1;

    const fileName = `temp_${Date.now()}`;
    const cppFilePath = path.join(TEMP_DIR, `${fileName}.cpp`);
    const exeFilePath = path.join(TEMP_DIR, `${fileName}.exe`);
    console.log(`handling cppFilePath = ${cppFilePath}`);
    console.log(`handling exeFilePath = ${exeFilePath}`);
    try {
        await fs.ensureDir(TEMP_DIR);
        await fs.writeFile(cppFilePath, code);

        await new Promise((resolve, reject) => {
            exec(`g++ "${cppFilePath}" -o "${exeFilePath}"`, (err, stdout, stderr) => {
                if (err) return reject(stderr || err.message);
                resolve(stdout);
            });
        });

        const results = await Promise.all(
            test_cases.map(({ input, expected_output, score }: { input: string; expected_output: string; score: number }) => {
                return new Promise<{
                    input: string;
                    output: string;
                    expected_output: string;
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
                        const passed = output === expected_output;
                        resolve({ input, output, expected_output: expected_output, passed, score });
                    });

                    if (child.stdin) {
                        child.stdin.write(input);
                        child.stdin.end();
                    }
                });
            })
        );

        const total_score = results.reduce((acc, test) => {
            return test.passed ? acc + test.score * scoreMultiplier : acc;
        }, 0);

        const allPassed = results.every((test) => test.passed);

        res.json({
            passed: allPassed,
            total_score: total_score.toFixed(3),
            results: results.map(({ passed, output, expected_output: expected_output, input }) => ({
                passed,
                output,
                expected_output,
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
