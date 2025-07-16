export interface PlayerData {
  token: string | null;
  id: string | null;
  name: string | null;
  email: string | null;
  avatarUrl?: string;
}

// Level select
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
