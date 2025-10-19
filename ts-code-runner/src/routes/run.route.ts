// ts-code-runner\src\routes\run.route.ts
import { Router } from "express";

import { TEMP_DIR } from "@/config";
import { TestCase, TestResult } from "@/types";
import { compileCppCode, compileJavaCode } from "@/services/compile.service";
import { runCppTest, runJavaTest } from "@/services/execute.service";

import fs from "fs-extra";
import path from "path";

const router = Router();

router.post("/run", async (req, res) => {
    const { code, test_cases, score_pct, language } = req.body as {
        code: string;
        test_cases: TestCase[];
        score_pct?: number;
        language: "cpp" | "java";
    };

    console.log("\n=== [RUN REQUEST] ===");
    console.log("Language:", language);
    console.log("Test cases:", test_cases.length);
    console.log("=====================\n");

    if (!Array.isArray(test_cases)) {
        console.error("❌ Invalid input: test_cases is not an array");
        res.status(400).json({ error: "Invalid input" });
        return;
    }

    const fileName = `temp_${Date.now()}`;
    let sourceFile: string | undefined;
    let exeFile: string | undefined;

    try {
        await fs.ensureDir(TEMP_DIR);
        console.log("✅ TEMP_DIR ensured:", TEMP_DIR);

        if (language === "cpp") {
            sourceFile = path.join(TEMP_DIR, `${fileName}.cpp`);
            exeFile = path.join(TEMP_DIR, `${fileName}.exe`);
            console.log("📝 Writing C++ source:", sourceFile);
            await fs.writeFile(sourceFile, code);

            console.log("⚙️ Compiling C++...");
            await compileCppCode(sourceFile, exeFile);
            console.log("✅ C++ compile success:", exeFile);
        } else if (language === "java") {
            // Extract class name from code
            const match = code.match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
            const className = match ? match[1] : `Main_${Date.now()}`;

            sourceFile = path.join(TEMP_DIR, `${className}.java`);
            console.log("📝 Writing Java source:", sourceFile);
            await fs.writeFile(sourceFile, code);

            console.log("⚙️ Compiling Java...");
            await compileJavaCode(sourceFile);
            console.log("✅ Java compile success");

            // Use the className for running tests
            exeFile = className;
        } else {
            throw new Error(`Unsupported language: ${language}`);
        }

        console.log("🚀 Running test cases...");
        const results: TestResult[] = await Promise.all(
            test_cases.map((tc) =>
                language === "cpp"
                    ? runCppTest(exeFile!, tc)
                    : runJavaTest(exeFile!, tc)
            )
        );

        console.log("✅ All tests completed");

        const scoreMultiplier = typeof score_pct === "number" ? score_pct : 1;
        const total_score = results.reduce(
            (acc, t) => (t.passed ? acc + t.score * scoreMultiplier : acc),
            0
        );
        const passed = results.every((r) => r.passed);

        res.json({ passed, total_score: Number(total_score.toFixed(3)), results });
    } catch (err: any) {
        console.error("❌ [RUN ERROR]:", err);
        const errorResults: TestResult[] = (test_cases || []).map((tc) => ({
            input: tc.input,
            output: `[Error] ${err.message}`,
            expected_output: tc.expected_output,
            passed: false,
            score: 0,
        }));

        res.json({
            passed: false,
            total_score: 0,
            results: errorResults,
        });
    } finally {
        console.log("🧹 Cleaning up temp files...");
        if (sourceFile) fs.remove(sourceFile).catch(() => { });
        if (language === "cpp" && exeFile) fs.remove(exeFile).catch(() => { });
    }
});

export default router;
