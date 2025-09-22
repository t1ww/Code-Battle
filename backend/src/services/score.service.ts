// backend\src\services\score.service.ts
import knex from "@/clients/knex.client";
import { SubmitScoreDTO, PlayerScore } from "@/dtos/score.dto";
import { withRetry } from "@/utils/withRetry";
import { getErrorMessage } from "@/utils/errorUtils";

export class ScoreService {
    async submitScore(
        data: SubmitScoreDTO
    ): Promise<{ message?: string; error_message?: string }> {
        if (!data.player_id || !data.question_id || data.score == null) {
            return { error_message: "All fields are required" };
        }

        try {
            const existing = await withRetry(() =>
                knex("scores")
                    .where({ player_id: data.player_id, question_id: data.question_id })
                    .first()
            );

            if (existing) {
                if (data.score > existing.score) {
                    await withRetry(() =>
                        knex("scores")
                            .where({ player_id: data.player_id, question_id: data.question_id })
                            .update({
                                score: data.score,
                                language: data.language,
                                modifier_state: data.modifier_state,
                            })
                    );
                    return { message: "Score successfully updated, new highscore." };
                } else {
                    return {
                        message: "Score not updated, previous score is higher or equal.",
                    };
                }
            } else {
                await withRetry(() =>
                    knex("scores").insert({
                        player_id: data.player_id,
                        question_id: data.question_id,
                        score: data.score,
                        language: data.language,
                        modifier_state: data.modifier_state,
                    })
                );
                return { message: "Score successfully submitted." };
            }
        } catch (err) {
            console.error("submitScore error:", getErrorMessage(err));
            return { error_message: "Failed to submit score." };
        }
    }

    async getTopScore(
        player_id: string,
        question_id: string
    ): Promise<PlayerScore | { error_message: string }> {
        if (!player_id || !question_id) return { error_message: "All fields are required." };

        try {
            const player = await withRetry(() =>
                knex("players").where({ player_id }).first()
            );
            if (!player) return { error_message: "Player not found." };

            const score = await withRetry(() =>
                knex("scores").where({ player_id, question_id }).first()
            );
            if (!score) return { error_message: "Score not found." };

            return {
                player_id: score.player_id,
                question_id: score.question_id,
                language: score.language,
                score: score.score,
                modifier_state: score.modifier_state,
            };
        } catch (err) {
            console.error("getTopScore error:", getErrorMessage(err));
            return { error_message: "Error fetching top score." };
        }
    }

    async getLeaderboard(
        question_id: string
    ): Promise<PlayerScore[] | { error_message: string }> {
        if (!question_id) return { error_message: "Question ID is required." };

        try {
            const question = await withRetry(() =>
                knex("questions").where({ question_id }).first()
            );
            if (!question) return { error_message: "Question not found." };

            const rows = await withRetry(() =>
                knex("scores as s")
                    .join("players as p", "s.player_id", "p.player_id")
                    .select(
                        "s.player_id",
                        "p.player_name",
                        "s.question_id",
                        "s.score",
                        "s.language",
                        "s.modifier_state"
                    )
                    .where("s.question_id", question_id)
                    .orderBy("s.score", "desc")
                    .limit(100)
            );

            return rows as PlayerScore[];
        } catch (err) {
            console.error("getLeaderboard error:", getErrorMessage(err));
            return { error_message: "Error fetching leaderboard." };
        }
    }
}
