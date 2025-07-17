import pool from "@/clients/database.client";
import { SubmitScoreDTO, PlayerScore } from "@/dtos/score.dto";
import { RowDataPacket } from "mysql2";

export class ScoreService {
    async submitScore(data: SubmitScoreDTO): Promise<void> {
        // Upsert pattern — one score per player per question
        const [existing] = await pool.query<RowDataPacket[]>(
            `SELECT * FROM scores WHERE player_id = ? AND question_id = ?`,
            [data.player_id, data.question_id]
        );

        if (existing.length > 0) {
            // Update if new score is higher
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
    }

    async getLeaderboard(question_id: string): Promise<PlayerScore[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
            s.player_id AS playerId,
            p.player_name AS playerName,
            s.question_id AS questionId,
            s.score,
            s.language,
            s.modifier_state AS modifierState
            FROM scores s
            JOIN players p ON s.player_id = p.player_id
            WHERE s.question_id = ?
            ORDER BY s.score DESC
            LIMIT 100`,
            [question_id]
        );

        return rows as PlayerScore[];
    }


    async getTopScore(question_id: string, player_id: string): Promise<PlayerScore | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
            s.player_id AS playerId,
            p.player_name AS playerName,
            s.question_id AS questionId,
            s.score,
            s.language,
            s.modifier_state AS modifierState
            FROM scores s
            JOIN players p ON s.player_id = p.player_id
            WHERE s.question_id = ? AND s.player_id = ?
            ORDER BY s.score DESC
            LIMIT 1`,
            [question_id, player_id]
        );

        return rows.length ? (rows[0] as PlayerScore) : null;
    }

}
