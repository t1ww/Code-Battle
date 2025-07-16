export interface PlayerData {
  token: string | null;
  id: string | null;
  name: string | null;
  email: string | null;
  avatarUrl?: string;
}

// Level select
export interface TestCase {
  input: string
  expectedOutput: string
  score: number
}

export interface Question {
    id: number;
    questionName: string;
    description: string;
    level: string;
    hint?: string;
    exampleInput?: string;
    exampleOutput?: string;
    startingCode: string;
    correctAnswerCode: string;
    testCases: TestCase[];
    estimatedRuntime: string;
    timeComplexity: string;
}

export interface LeaderboardEntry {
  name: string;
  language: string;
  modifier: string;
  score: number;
}

// Matchmaking
export const MatchState = {
  Searching:   'searching',
  Found:       'found',
  ShowingTeams:'showingTeams',
  Countdown:   'countdown',
  Started:     'started',
} as const

export type MatchState = typeof MatchState[keyof typeof MatchState]

// Gameplay
export interface CodeRunRequest {
  code: string
  testCases: TestCase[]
  scorePct: number
}

export interface CodeRunResult {
  input: string
  output: string
  expected: string
  passed: boolean
  score: number // Optional: echoed back for convenience
}

export interface CodeRunResponse {
  results: CodeRunResult[]
  totalScore: number // Optional
}
