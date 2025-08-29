// ts-code-runner/server.ts
import cors from "cors";
import express from "express";
import fs from "fs-extra";
import path from "path";
import { exec, spawn } from "child_process";
import { fileURLToPath } from "url";

type TestCase = { input: string; expected_output: string; score: number };
type TestResult = {
    input: string;
    output: string;
    expected_output: string;
    passed: boolean;
    score: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

const TEMP_DIR = path.join(__dirname, "temp");
fs.ensureDirSync(TEMP_DIR);

const RUNTIME_TIMEOUT_MS = 3000;

function runSingleTest(
    exeFilePath: string,
    tc: TestCase
): Promise<TestResult> {
    return new Promise<TestResult>((resolve) => {
        const child = spawn(exeFilePath, [], { stdio: ["pipe", "pipe", "pipe"] });
        let output = "";
        let stderrOutput = "";
        let timedOut = false;

        const timeoutId = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, RUNTIME_TIMEOUT_MS);

        child.stdout.on("data", (data: any) => {
            output += String(data);
        });

        child.stderr.on("data", (data: any) => {
            stderrOutput += String(data);
        });

        child.on("close", (code) => {
            clearTimeout(timeoutId);
            output = output.trim();

            if (timedOut) {
                resolve({
                    input: tc.input,
                    output: "[Timeout]",
                    expected_output: tc.expected_output,
                    passed: false,
                    score: tc.score,
                });
                return;
            }

            if (code !== 0) {
                resolve({
                    input: tc.input,
                    output:
                        `[Runtime Error] ` +
                        (stderrOutput.trim() || `Exited with code ${code}`),
                    expected_output: tc.expected_output,
                    passed: false,
                    score: tc.score,
                });
                return;
            }

            const passed = output === tc.expected_output;
            resolve({
                input: tc.input,
                output,
                expected_output: tc.expected_output,
                passed,
                score: tc.score,
            });
        });

        if (child.stdin) {
            child.stdin.write(tc.input);
            child.stdin.end();
        }
    });
}

app.post("/run", async (req, res): Promise<any> => {
    const { code, test_cases, score_pct } = req.body as {
        code: string;
        test_cases: TestCase[];
        score_pct?: number;
    };

    if (!Array.isArray(test_cases)) {
        return res.status(400).json({ error: "Invalid input" });
    }

    if (!code || !code.trim()) {
        const results: TestResult[] = test_cases.map((tc) => ({
            input: tc.input,
            output: "",
            expected_output: tc.expected_output,
            passed: false,
            score: tc.score,
        }));
        return res.json({ passed: false, total_score: 0, results });
    }

    const scoreMultiplier = typeof score_pct === "number" ? score_pct : 1;

    const fileName = `temp_${Date.now()}`;
    const cppFilePath = path.join(TEMP_DIR, `${fileName}.cpp`);
    const exeFilePath = path.join(TEMP_DIR, `${fileName}.exe`);

    try {
        await fs.ensureDir(TEMP_DIR);
        await fs.writeFile(cppFilePath, code);

        // compile
        try {
            await new Promise<void>((resolve, reject) => {
                exec(`g++ "${cppFilePath}" -o "${exeFilePath}"`, (err, _stdout, stderr) => {
                    if (err) return reject(new Error(stderr || err.message));
                    resolve();
                });
            });
        } catch (compileErr: any) {
            const msg =
                String(compileErr?.message || compileErr || "Compilation failed").trim();
            const results: TestResult[] = [
                {
                    input: "",
                    output: `[Compilation Error]\n${msg}`,
                    expected_output: "",
                    passed: false,
                    score: 0,
                },
            ];
            return res.json({ passed: false, total_score: 0, results });
        }

        // run each test case
        const results: TestResult[] = await Promise.all(
            test_cases.map((tc) => runSingleTest(exeFilePath, tc))
        );

        const total_score = results.reduce(
            (acc, t) => (t.passed ? acc + t.score * scoreMultiplier : acc),
            0
        );
        const allPassed = results.every((t) => t.passed);

        return res.json({
            passed: allPassed,
            total_score: Number(total_score.toFixed(3)),
            results,
        });
    } catch (error: any) {
        // fallback (unexpected server-side error)
        return res.json({
            passed: false,
            total_score: 0,
            results: [
                {
                    input: "",
                    output:
                        `[Server Error] ` +
                        (String(error?.message || error || "Unknown error").trim()),
                    expected_output: "",
                    passed: false,
                    score: 0,
                },
            ],
        });
    } finally {
        // cleanup
        fs.remove(cppFilePath).catch(() => { });
        fs.remove(exeFilePath).catch(() => { });
    }
});

app.listen(5001, () => console.log("Server running on port 5001"));
