import pool from "@/clients/database.client";
import { RowDataPacket } from "mysql2";
import {
    CreateQuestionInput,
    QuestionResponse,
    TestCaseResponse,
    UpdateQuestionInput,
} from "@/dtos/question.dto";

export class QuestionService {
    async getQuestionById(id: string): Promise<QuestionResponse> {
        const [questionRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM questions WHERE question_id = ?",
            [id]
        );

        if (questionRows.length === 0) throw new Error("Question not found");
        const question = questionRows[0];

        const [testCaseRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM test_cases WHERE question_id = ?",
            [id]
        );

        return {
            id: question.question_id,
            questionName: question.question_name,
            description: question.description,
            timeLimit: question.time_limit,
            level: question.level,
            testCases: testCaseRows.map((tc): TestCaseResponse => ({
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
            questionName: question.question_name,
            description: question.description,
            timeLimit: question.time_limit,
            level: question.level,
            testCases: testCaseRows.map((tc): TestCaseResponse => ({
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
            [data.questionName, data.description, data.timeLimit, data.level]
        );

        const questionId = result.insertId;

        for (const tc of data.testCases) {
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

        if (data.questionName) {
            fields.push("question_name = ?");
            values.push(data.questionName);
        }
        if (data.description) {
            fields.push("description = ?");
            values.push(data.description);
        }
        if (data.timeLimit) {
            fields.push("time_limit = ?");
            values.push(data.timeLimit);
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

        if (data.testCases) {
            await pool.query("DELETE FROM test_cases WHERE question_id = ?", [id]);
            for (const tc of data.testCases) {
                await pool.query(
                    "INSERT INTO test_cases (question_id, input, expected_output, score) VALUES (?, ?, ?, ?)",
                    [id, tc.input, tc.expectedOutput, tc.score]
                );
            }
        }

        return this.getQuestionById(id);
    }
}
