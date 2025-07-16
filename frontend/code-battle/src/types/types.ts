export interface PlayerData {
  token: string | null;
  id: string | null;
  name: string | null;
  email: string | null;
  avatarUrl?: string;
}

export interface Question {
    id: number;
    questionName: string;
    description: string;
    hint?: string;
    exampleInput: string;
    exampleOutput: string;
    startingCode: string;
    correctAnswerCode: string;
    testCases: { input: string; expectedOutput: string }[];
    estimatedRuntime: string;
    timeComplexity: string;
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
