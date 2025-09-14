// ts-code-runner\routes\run.route.ts
import { Router } from "express";
import fs from "fs-extra";
import path from "path";
import { TEMP_DIR } from "../config.js";
import { compileCode } from "../services/compile.service.js";
import { runSingleTest } from "../services/execute.service.js";
import type { TestCase, TestResult } from "../types.js";

const router = Router();

router.post("/run", async (req, res) => {
    const { code, test_cases, score_pct } = req.body as {
        code: string;
        test_cases: TestCase[];
        score_pct?: number;
    };

    if (!Array.isArray(test_cases)) {
        res.status(400).json({ error: "Invalid input" });
        return;
    }

    const fileName = `temp_${Date.now()}`;
    const cppFile = path.join(TEMP_DIR, `${fileName}.cpp`);
    const exeFile = path.join(TEMP_DIR, `${fileName}.exe`);

    try {
        await fs.ensureDir(TEMP_DIR);
        await fs.writeFile(cppFile, code);
        await compileCode(cppFile, exeFile);

        const results: TestResult[] = await Promise.all(
            test_cases.map((tc) => runSingleTest(exeFile, tc))
        );

        const scoreMultiplier = typeof score_pct === "number" ? score_pct : 1;
        const total_score = results.reduce(
            (acc, t) => (t.passed ? acc + t.score * scoreMultiplier : acc),
            0
        );
        const passed = results.every((r) => r.passed);

        res.json({ passed, total_score: Number(total_score.toFixed(3)), results });
    } catch (err: any) {
        res.json({
            passed: false,
            total_score: 0,
            results: [{ input: "", output: `[Error] ${err.message}`, expected_output: "", passed: false, score: 0 }]
        });
    } finally {
        fs.remove(cppFile).catch(() => { });
        fs.remove(exeFile).catch(() => { });
    }
});

export default router;
