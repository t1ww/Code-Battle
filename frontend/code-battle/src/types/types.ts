export interface PlayerData {
  token: string | null;
  id: string | null;
  name: string | null;
  email: string | null;
}

export interface Question {
    id: number;
    questionName: string;
    questionDescription: string;
    hint: string;
    exampleInput: string;
    exampleOutput: string;
    startingCode: string;
    correctAnswerCode: string;
    testCases: { input: string; expectedOutput: string }[];
    estimatedRuntime: string;
    timeComplexity: string;
}