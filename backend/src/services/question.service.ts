import pool from "@/clients/database.client";
import { RowDataPacket } from "mysql2";
import {
    CreateQuestionInput,
    QuestionResponse,
    TestCaseResponse,
    UpdateQuestionInput,
} from "@/dtos/question.dto";

export class QuestionService {
    async getQuestionById(question_id: string): Promise<QuestionResponse> {
        // ✅ UTC-16 ID 3: Empty question ID
        if (!question_id) {
            throw new Error("Question ID is required");
        }

        const [questionRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM questions WHERE question_id = ?",
            [question_id]
        );

        // ✅ UTC-16 ID 2: Question not found
        if (questionRows.length === 0) {
            throw new Error("Question not found");
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
                expectedOutput: tc.expected_output,
                score: tc.score,
            })),
        };
    }


    async getAQuestion(level: "Easy" | "Medium" | "Hard"): Promise<QuestionResponse> {
        const [questionRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM questions WHERE level = ? ORDER BY RAND() LIMIT 1",
            [level]
        );

        if (questionRows.length === 0) throw new Error("No questions found");
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
                expectedOutput: tc.expected_output,
                score: tc.score,
            })),
        };
    }

    async createQuestion(data: CreateQuestionInput): Promise<QuestionResponse> {
        const [result] = await pool.query<any>(
            "INSERT INTO questions (question_name, description, time_limit, level) VALUES (?, ?, ?, ?)",
            [data.question_name, data.description, data.time_limit, data.level]
        );

        const questionId = result.insertId;

        for (const tc of data.test_cases) {
            await pool.query(
                "INSERT INTO test_cases (question_id, input, expected_output, score) VALUES (?, ?, ?, ?)",
                [questionId, tc.input, tc.expectedOutput, tc.score]
            );
        }

        return this.getQuestionById(questionId);
    }

    async updateQuestion(id: string, data: UpdateQuestionInput): Promise<QuestionResponse> {
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
                    [id, tc.input, tc.expectedOutput, tc.score]
                );
            }
        }

        return this.getQuestionById(id);
    }
}
