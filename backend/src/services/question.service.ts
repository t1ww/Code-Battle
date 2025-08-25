// backend\src\services\question.service.ts
import pool from "@/clients/database.client";
import { RowDataPacket } from "mysql2";
import {
    CreateQuestionInput,
    QuestionResponse,
    TestCaseResponse,
    UpdateQuestionInput,
} from "@/dtos/question.dto";

type QuestionResponseWithError = QuestionResponse | { error_message: string };

export class QuestionService {
    async getQuestionById(question_id: string): Promise<QuestionResponseWithError> {
        // ✅ UTC-16 ID 3: Empty question ID
        if (!question_id) {
            return { error_message: "Question ID is required" };
        }

        const [questionRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM questions WHERE question_id = ?",
            [question_id]
        );

        // ✅ UTC-16 ID 2: Question not found
        if (questionRows.length === 0) {
            return { error_message: "Question not found" };
        }

        const question = questionRows[0];

        const [testCaseRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM test_cases WHERE question_id = ?",
            [question_id]
        );

        // ✅ UTC-16 ID 1: Valid question ID
        return {
            id: question.question_id,
            question_name: question.question_name,
            description: question.description,
            time_limit: question.time_limit,
            level: question.level,
            test_cases: testCaseRows.map(tc => ({
                id: tc.test_case_id,
                input: tc.input,
                expected_output: tc.expected_output,
                score: tc.score,
            })),
        };
    }

    async getAQuestion(level: "Easy" | "Medium" | "Hard"): Promise<QuestionResponseWithError> {
        // ✅ UTC-17 ID 3: Empty input
        if (!level) {
            return { error_message: "Level input must not be empty" };
        }

        // ✅ UTC-17 ID 2: Invalid level
        const validLevels = ["Easy", "Medium", "Hard"];
        if (!validLevels.includes(level)) {
            return { error_message: "Invalid level input" };
        }

        const [questionRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM questions WHERE level = ? ORDER BY RAND() LIMIT 1",
            [level]
        );

        // No questions found for the level
        if (questionRows.length === 0) {
            return { error_message: "No questions found" };
        }
        const question = questionRows[0];

        const [testCaseRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM test_cases WHERE question_id = ?",
            [question.question_id]
        );

        return {
            id: question.question_id,
            question_name: question.question_name,
            description: question.description,
            time_limit: question.time_limit,
            level: question.level,
            test_cases: testCaseRows.map((tc): TestCaseResponse => ({
                id: tc.test_case_id,
                input: tc.input,
                expected_output: tc.expected_output,
                score: tc.score,
            })),
        };
    }

    async createQuestion(data: CreateQuestionInput): Promise<QuestionResponseWithError> {
        if (!data.question_name || !data.description || !data.time_limit || !data.level) {
            return { error_message: "All fields are required" };
        }

        try {
            const [result] = await pool.query<any>(
                "INSERT INTO questions (question_name, description, time_limit, level) VALUES (?, ?, ?, ?)",
                [data.question_name, data.description, data.time_limit, data.level]
            );

            const questionId = result.insertId;

            for (const tc of data.test_cases) {
                await pool.query(
                    "INSERT INTO test_cases (question_id, input, expected_output, score) VALUES (?, ?, ?, ?)",
                    [questionId, tc.input, tc.expected_output, tc.score]
                );
            }

            return this.getQuestionById(questionId);
        } catch {
            return { error_message: "Failed to create question" };
        }
    }

    async updateQuestion(id: string, data: UpdateQuestionInput): Promise<QuestionResponseWithError> {
        try {
            const fields: string[] = [];
            const values: any[] = [];

            if (data.question_name) {
                fields.push("question_name = ?");
                values.push(data.question_name);
            }
            if (data.description) {
                fields.push("description = ?");
                values.push(data.description);
            }
            if (data.time_limit) {
                fields.push("time_limit = ?");
                values.push(data.time_limit);
            }
            if (data.level) {
                fields.push("level = ?");
                values.push(data.level);
            }

            if (fields.length) {
                await pool.query(
                    `UPDATE questions SET ${fields.join(", ")} WHERE question_id = ?`,
                    [...values, id]
                );
            }

            if (data.test_cases) {
                await pool.query("DELETE FROM test_cases WHERE question_id = ?", [id]);
                for (const tc of data.test_cases) {
                    await pool.query(
                        "INSERT INTO test_cases (question_id, input, expected_output, score) VALUES (?, ?, ?, ?)",
                        [id, tc.input, tc.expected_output, tc.score]
                    );
                }
            }

            return this.getQuestionById(id);
        } catch {
            return { error_message: "Failed to update question" };
        }
    }
}
