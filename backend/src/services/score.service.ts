// backend\src\services\score.service.ts
import pool from "@/clients/database.client";
import { SubmitScoreDTO, PlayerScore } from "@/dtos/score.dto";
import { RowDataPacket } from "mysql2";

export class ScoreService {
    async submitScore(data: SubmitScoreDTO): Promise<{ message?: string; error_message?: string }> {
        // ✅ UTC-18 ID 2: Empty fields
        if (!data.player_id || !data.question_id || data.score == null) {
            return { error_message: "All fields are required" };
        }

        const [existing] = await pool.query<RowDataPacket[]>(
            `SELECT * FROM scores WHERE player_id = ? AND question_id = ?`,
            [data.player_id, data.question_id]
        );

        if (existing.length > 0) {
            const prevScore = existing[0].score;
            if (data.score > prevScore) {
                await pool.query(
                    `UPDATE scores SET score = ?, language = ?, modifier_state = ? WHERE player_id = ? AND question_id = ?`,
                    [data.score, data.language, data.modifier_state, data.player_id, data.question_id]
                );
            }
        } else {
            await pool.query(
                `INSERT INTO scores (player_id, question_id, score, language, modifier_state) VALUES (?, ?, ?, ?, ?)`,
                [data.player_id, data.question_id, data.score, data.language, data.modifier_state]
            );
        }

        // ✅ UTC-18 ID 1: Valid score submission
        return { message: "Score successfully submitted" };
    }

    async getTopScore(player_id: string, question_id: string): Promise<PlayerScore | { error_message: string }> {
        // ✅ UTC-19 ID 4: Empty fields
        if (!player_id || !question_id) {
            return { error_message: "All fields are required" };
        }

        // Check if player exists
        const [playerRows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM players WHERE id = ?",
            [player_id]
        );
        if (playerRows.length === 0) {
            return { error_message: "Player not found" };
        }

        // Get score record
        const [scoreRows] = await pool.query<RowDataPacket[]>(
            "SELECT player_id, question_id, language, score, modifier_state FROM scores WHERE player_id = ? AND question_id = ?",
            [player_id, question_id]
        );
        if (scoreRows.length === 0) {
            return { error_message: "Score not found" };
        }

        const score = scoreRows[0];
        // ✅ UTC-19 ID 1: Valid player and question query
        return {
            player_id: score.player_id,
            question_id: score.question_id,
            language: score.language,
            score: score.score,
            modifier_state: score.modifier_state,
        };
    }

    async getLeaderboard(question_id: string): Promise<PlayerScore[] | { error_message: string }> {
        // ✅ UTC-20 ID 3: Empty question ID
        if (!question_id) {
            return { error_message: "Question ID is required" };
        }

        // Check if question exists
        const [questionRows] = await pool.query<RowDataPacket[]>(
            "SELECT question_id FROM questions WHERE question_id = ?",
            [question_id]
        );
        if (questionRows.length === 0) {
            // ✅ UTC-20 ID 2: Unknown question ID
            return { error_message: "Question not found" };
        }

        // ✅ UTC-20 ID 1: Valid leaderboard
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
            s.player_id,
            p.player_name,
            s.question_id,
            s.score,
            s.language,
            s.modifier_state
        FROM scores s
        JOIN players p ON s.player_id = p.player_id
        WHERE s.question_id = ?
        ORDER BY s.score DESC
        LIMIT 100`,
            [question_id]
        );

        return rows as PlayerScore[];
    }

}
