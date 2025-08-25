// backend\src\dtos\score.dto.ts
export enum ModifierState {
    None = "None",
    Sabotage = "Sabotage",
    Confident = "Confident",
}

export interface SubmitScoreDTO {
    player_id: string;
    question_id: string;
    score: number;
    language: string;
    modifier_state: ModifierState;
}

export interface PlayerScore {
    player_id: string;
    question_id: string;
    score: number;
    language: string;
    modifier_state: ModifierState;
}
