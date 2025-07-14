export interface CreateQuestionInput {
    questionName: string;
    description: string;
    timeLimit: number;
    level: "Easy" | "Medium" | "Hard";
    testCases: {
        input: string;
        expectedOutput: string;
        score: number;
    }[];
}

export interface UpdateQuestionInput extends Partial<CreateQuestionInput> { }

export interface TestCaseResponse {
    id: number;
    input: string;
    expectedOutput: string;
    score: number;
}

export interface QuestionResponse {
    id: number;
    questionName: string;
    description: string;
    timeLimit: number;
    level: "Easy" | "Medium" | "Hard";
    testCases: TestCaseResponse[];
}
