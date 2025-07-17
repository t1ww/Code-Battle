export interface SubmitScoreDTO {
    player_id: string;
    question_id: string;
    score: number;
    language: string;
    modifier_state: string;
}

export interface PlayerScore {
    playerId: string;
    questionId: string;
    score: number;
    language: string;
    modifierState: string;
}
