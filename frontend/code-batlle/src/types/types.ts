export interface UserData {
  token: string | null;
  id: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
}
export interface TeamMember {
  name: string
  role: string
  description: string
  email: string
  image: string
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