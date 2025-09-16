// backend/src/services/question.service.ts
import knex from "@/clients/knex.client";
import {
    CreateQuestionInput,
    QuestionResponse,
    TestCaseResponse,
    UpdateQuestionInput,
} from "@/dtos/question.dto";

type QuestionResponseWithError = QuestionResponse | { error_message: string };

export class QuestionService {
    async getQuestionById(question_id: string): Promise<QuestionResponseWithError> {
        if (!question_id) return { error_message: "Question ID is required." };

        const question = await knex("questions")
            .where({ question_id })
            .first();

        if (!question) return { error_message: "Question not found." };

        const test_cases = await knex("test_cases")
            .where({ question_id });

        return {
            id: question.question_id,
            question_name: question.question_name,
            description: question.description,
            time_limit: question.time_limit,
            level: question.level,
            test_cases: test_cases.map((tc): TestCaseResponse => ({
                id: tc.test_case_id,
                input: tc.input,
                expected_output: tc.expected_output,
                score: tc.score,
            })),
        };
    }

    async getAQuestion(level: "Easy" | "Medium" | "Hard"): Promise<QuestionResponseWithError> {
        if (!level) return { error_message: "Level input must not be empty." };
        if (!["Easy", "Medium", "Hard"].includes(level)) return { error_message: "Invalid level input." };

        const question = await knex("questions")
            .where({ level })
            .orderByRaw("RANDOM()") // PostgreSQL random
            .first();

        if (!question) return { error_message: "No questions found." };

        const test_cases = await knex("test_cases")
            .where({ question_id: question.question_id });

        return {
            id: question.question_id,
            question_name: question.question_name,
            description: question.description,
            time_limit: question.time_limit,
            level: question.level,
            test_cases: test_cases.map((tc): TestCaseResponse => ({
                id: tc.test_case_id,
                input: tc.input,
                expected_output: tc.expected_output,
                score: tc.score,
            })),
        };
    }

    async getRandomQuestions(count: number = 3): Promise<QuestionResponse[] | { error_message: string }> {
        try {
            const questions = await knex("questions")
                .orderByRaw("RANDOM()")
                .limit(count);

            if (!questions.length) {
                return { error_message: "No questions found." };
            }

            const results: QuestionResponse[] = [];

            for (const q of questions) {
                const test_cases = await knex("test_cases")
                    .where({ question_id: q.question_id });

                results.push({
                    id: q.question_id,
                    question_name: q.question_name,
                    description: q.description,
                    time_limit: q.time_limit,
                    level: q.level,
                    test_cases: test_cases.map((tc): TestCaseResponse => ({
                        id: tc.test_case_id,
                        input: tc.input,
                        expected_output: tc.expected_output,
                        score: tc.score,
                    })),
                });
            }

            return results;
        } catch {
            return { error_message: "Error fetching random questions." };
        }
    }

    async createQuestion(data: CreateQuestionInput): Promise<QuestionResponseWithError> {
        if (!data.question_name || !data.description || !data.time_limit || !data.level) {
            return { error_message: "All fields are required." };
        }

        try {
            const [question_id] = await knex("questions")
                .insert({
                    question_name: data.question_name,
                    description: data.description,
                    time_limit: data.time_limit,
                    level: data.level,
                })
                .returning("question_id"); // PostgreSQL returns inserted id

            if (data.test_cases?.length) {
                await knex("test_cases").insert(
                    data.test_cases.map(tc => ({
                        question_id,
                        input: tc.input,
                        expected_output: tc.expected_output,
                        score: tc.score,
                    }))
                );
            }

            return this.getQuestionById(question_id);
        } catch {
            return { error_message: "Failed to create question." };
        }
    }

    async updateQuestion(id: string, data: UpdateQuestionInput): Promise<QuestionResponseWithError> {
        try {
            const updateData: any = {};
            if (data.question_name) updateData.question_name = data.question_name;
            if (data.description) updateData.description = data.description;
            if (data.time_limit) updateData.time_limit = data.time_limit;
            if (data.level) updateData.level = data.level;

            if (Object.keys(updateData).length) {
                await knex("questions")
                    .where({ question_id: id })
                    .update(updateData);
            }

            if (data.test_cases) {
                await knex("test_cases").where({ question_id: id }).del();
                await knex("test_cases").insert(
                    data.test_cases.map(tc => ({
                        question_id: id,
                        input: tc.input,
                        expected_output: tc.expected_output,
                        score: tc.score,
                    }))
                );
            }

            return this.getQuestionById(id);
        } catch {
            return { error_message: "Failed to update question." };
        }
    }
}
