export interface PlayerData {
  token: string | null;
  id: string | null;
  name: string | null;
  email: string | null;
  avatar_url?: string;
}

// Level select
export interface TestCase {
  input: string;
  expected_output: string;
  score: number;
}

export interface Question {
  id: number;
  question_name: string;
  description: string;
  time_limit: number;
  level: string;
  test_cases: TestCase[];
}

export interface LeaderboardEntry {
  player_name: string;
  score: number;
  language: string;
  modifier_state: string;
}

// Matchmaking
export const MatchState = {
  Searching: 'searching',
  Found: 'found',
  ShowingTeams: 'showingTeams',
  Countdown: 'countdown',
  Started: 'started',
} as const;

export type MatchState = typeof MatchState[keyof typeof MatchState];

// Gameplay
export interface CodeRunRequest {
  code: string;
  test_cases: TestCase[];
  score_pct: number;
}

export interface CodeRunResult {
  input: string;
  output: string;
  expected: string;
  passed: boolean;
  score: number;
}

export interface CodeRunResponse {
  passed: boolean;
  results: CodeRunResult[];
  total_score: number;
}

// Score
export interface ScoreSubmitRequest {
  player_id: string;
  question_id: string;
  score: number;
  language: string;
  modifier_state: "None" | "Sabotage" | "Confident";
}
