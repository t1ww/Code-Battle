import { Router, Request, Response } from "express";
import pool from "@/database";

const router = Router();

// Get all questions (without test cases)
router.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const [rows] = await pool.query(
      "SELECT id, questionName, questionDescription FROM questions"
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Get a question by id including its test cases
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const [questions]: any = await pool.query(
      "SELECT * FROM questions WHERE id = ?",
      [id]
    );
    if (questions.length === 0) {
      return res.status(404).json({ error: "Question not found" });
    }
    const question = questions[0];
    // Fetch test cases linked to the question, ordered by the `order` column
    const [testCases]: any = await pool.query(
      "SELECT * FROM test_cases WHERE questionId = ? ORDER BY `order` ASC",
      [id]
    );
    res.json({ ...question, testCases });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Create a new question (and associated test cases)
router.post("/", async (req: Request, res: Response): Promise<any> => {
  const {
    questionName,
    questionDescription,
    hint,
    exampleInput,
    exampleOutput,
    startingCode,
    correctAnswerCode,
    testCases,
    estimatedRuntime,
    timeComplexity,
  } = req.body;

  try {
    // Insert into questions table (no testCases field anymore)
    const [result]: any = await pool.query(
      `INSERT INTO questions 
 (questionName, questionDescription, hint, exampleInput, exampleOutput, startingCode, correctAnswerCode, estimatedRuntime, timeComplexity)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questionName,
        questionDescription,
        hint,
        exampleInput,
        exampleOutput,
        startingCode,
        correctAnswerCode,
        estimatedRuntime,
        timeComplexity,
      ]
    );
    const questionId = result.insertId;

    // Insert each test case into test_cases table
    if (Array.isArray(testCases) && testCases.length > 0) {
      for (const tc of testCases) {
        // Expecting each test case object to provide input, expectedOutput, description (optional) and order (optional)
        const { input, expectedOutput, description, order = 0 } = tc;
        await pool.query(
          `INSERT INTO test_cases (questionId, input, expectedOutput, description, \`order\`) 
           VALUES (?, ?, ?, ?, ?)`,
          [questionId, input, expectedOutput, description, order]
        );
      }
    }

    res.status(201).json({
      id: questionId,
      questionName,
      questionDescription,
      hint,
      exampleInput,
      exampleOutput,
      startingCode,
      correctAnswerCode,
      estimatedRuntime,
      timeComplexity,
      testCases,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to create question",
      details: (err as any).message,
    });
  }
});

// Update an existing question (and its test cases)
router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const {
    questionName,
    questionDescription,
    hint,
    exampleInput,
    exampleOutput,
    startingCode,
    correctAnswerCode,
    testCases,
    estimatedRuntime,
    timeComplexity,
  } = req.body;

  try {
    const [result]: any = await pool.query(
      `UPDATE questions 
       SET questionName = ?, questionDescription = ?, hint = ?, exampleInput = ?, exampleOutput = ?, startingCode = ?, correctAnswerCode = ?, estimatedRuntime = ?, timeComplexity = ?
       WHERE id = ?`,
      [
        questionName,
        questionDescription,
        hint,
        exampleInput,
        exampleOutput,
        startingCode,
        correctAnswerCode,
        estimatedRuntime,
        timeComplexity,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Update test cases: delete existing entries and re-insert new ones
    await pool.query("DELETE FROM test_cases WHERE questionId = ?", [id]);
    if (Array.isArray(testCases) && testCases.length > 0) {
      for (const tc of testCases) {
        const { input, expectedOutput, description, order = 0 } = tc;
        await pool.query(
          `INSERT INTO test_cases (questionId, input, expectedOutput, description, \`order\`)
           VALUES (?, ?, ?, ?, ?)`,
          [id, input, expectedOutput, description, order]
        );
      }
    }

    res.json({ message: "Question updated successfully" });
  } catch (err) {
    res.status(500).json({
      error: "Failed to update question",
      details: (err as any).message,
    });
  }
});

// Delete a question (with test cases being removed by cascading)
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query(
      "DELETE FROM questions WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({
      error: "Failed to delete question",
      details: (err as any).message,
    });
  }
});

export default router;
