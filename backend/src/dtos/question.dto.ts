export interface TestCaseResponse {
    id: number;
    input: string;
    expectedOutput: string;
    score: number;
}

export interface CreateQuestionInput {
    question_name: string;
    description: string;
    time_limit: number;
    level: "Easy" | "Medium" | "Hard";
    test_cases: TestCaseResponse[];
}

export interface UpdateQuestionInput extends Partial<CreateQuestionInput> { }

export interface QuestionResponse {
    id: number;
    question_name: string;
    description: string;
    time_limit: number;
    level: "Easy" | "Medium" | "Hard";
    test_cases: TestCaseResponse[];
}
