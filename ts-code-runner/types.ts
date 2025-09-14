// ts-code-runner\types.ts
export type TestCase = { input: string; expected_output: string; score: number };
export type TestResult = {
  input: string;
  output: string;
  expected_output: string;
  passed: boolean;
  score: number;
};
