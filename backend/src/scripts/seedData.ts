import pool from "@/clients/database.client";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { ResultSetHeader, RowDataPacket } from "mysql2";
dotenv.config();

async function seedData() {
    try {
        // Prepare players data
        const playersData = Array.from({ length: 9 }, (_, i) => [
            `user${i + 1}`,
            `user${i + 1}@example.com`,
            "123456",
        ]);

        const playerIds: number[] = [];

        for (const [name, email, plainPw] of playersData) {
            const hashedPw = await bcrypt.hash(plainPw, 10);

            const [result] = (await pool.query<ResultSetHeader>(
                "INSERT INTO players (player_name, email, password_hash) VALUES (?, ?, ?)",
                [name, email, hashedPw]
            )) as [ResultSetHeader, any];

            playerIds.push(result.insertId);
        }

        // Questions with real test cases
        const questionsData = [
            // Easy
            {
                name: "Sum Two Numbers",
                description: "Given two numbers, return their sum.",
                time_limit: 300, // seconds (5 minutes)
                level: "Easy",
                test_cases: [
                    { input: "2 3", expected_output: "5", score: 10 },
                    { input: "-1 5", expected_output: "4", score: 10 },
                    { input: "0 0", expected_output: "0", score: 10 },
                ],
            },
            {
                name: "Find Maximum",
                description: "Given three integers, find the maximum.",
                time_limit: 300, // seconds (5 minutes)
                level: "Easy",
                test_cases: [
                    { input: "1 2 3", expected_output: "3", score: 10 },
                    { input: "10 5 7", expected_output: "10", score: 10 },
                    { input: "-1 -2 -3", expected_output: "-1", score: 10 },
                ],
            },
            {
                name: "Check Even",
                description: "Given an integer, output 'Yes' if even, else 'No'.",
                time_limit: 300, // seconds (5 minutes)
                level: "Easy",
                test_cases: [
                    { input: "4", expected_output: "Yes", score: 10 },
                    { input: "7", expected_output: "No", score: 10 },
                    { input: "0", expected_output: "Yes", score: 10 },
                ],
            },

            // Medium
            {
                name: "Fibonacci Number",
                description: "Return the N-th Fibonacci number (0-indexed).",
                time_limit: 900, // seconds (15 minutes)
                level: "Medium",
                test_cases: [
                    { input: "5", expected_output: "5", score: 15 },
                    { input: "10", expected_output: "55", score: 15 },
                    { input: "0", expected_output: "0", score: 15 },
                ],
            },
            {
                name: "Palindrome Check",
                description: "Check if a string is palindrome. Output 'Yes' or 'No'.",
                time_limit: 900, // seconds (15 minutes)
                level: "Medium",
                test_cases: [
                    { input: "madam", expected_output: "Yes", score: 15 },
                    { input: "hello", expected_output: "No", score: 15 },
                    { input: "racecar", expected_output: "Yes", score: 15 },
                ],
            },
            {
                name: "Count Vowels",
                description: "Count vowels (a,e,i,o,u) in the input string.",
                time_limit: 900, // seconds (15 minutes)
                level: "Medium",
                test_cases: [
                    { input: "hello", expected_output: "2", score: 15 },
                    { input: "sky", expected_output: "0", score: 15 },
                    { input: "aeiouAEIOU", expected_output: "10", score: 15 },
                ],
            },

            // Hard
            {
                name: "Merge Intervals",
                description:
                    "Given a list of intervals, merge all overlapping intervals and return the result.",
                time_limit: 1800, // seconds (30 minutes)
                level: "Hard",
                test_cases: [
                    {
                        input: "[[1,3],[2,6],[8,10],[15,18]]",
                        expected_output: "[[1,6],[8,10],[15,18]]",
                        score: 20,
                    },
                    {
                        input: "[[1,4],[4,5]]",
                        expected_output: "[[1,5]]",
                        score: 20,
                    },
                    {
                        input: "[]",
                        expected_output: "[]",
                        score: 20,
                    },
                ],
            },
            {
                name: "Longest Substring Without Repeating",
                description:
                    "Given a string, find the length of the longest substring without repeating characters.",
                time_limit: 1800, // seconds (30 minutes)
                level: "Hard",
                test_cases: [
                    { input: "abcabcbb", expected_output: "3", score: 20 },
                    { input: "bbbbb", expected_output: "1", score: 20 },
                    { input: "pwwkew", expected_output: "3", score: 20 },
                ],
            },
            {
                name: "Word Ladder",
                description:
                    "Given two words (start and end), and a dictionary, find the shortest transformation sequence length from start to end.",
                time_limit: 1800, // seconds (30 minutes)
                level: "Hard",
                test_cases: [
                    { input: "hit cog [hot dot dog lot log]", expected_output: "5", score: 20 },
                    { input: "hit cog [hot dot dog lot log hog]", expected_output: "4", score: 20 },
                    { input: "hit hit [hot dot dog]", expected_output: "1", score: 20 },
                ],
            },
        ];

        const questionIds: number[] = [];

        for (const q of questionsData) {
            const [res] = (await pool.query<ResultSetHeader>(
                "INSERT INTO questions (question_name, description, time_limit, level) VALUES (?, ?, ?, ?)",
                [q.name, q.description, q.time_limit, q.level]
            )) as [ResultSetHeader, any];

            const questionId = res.insertId;
            questionIds.push(questionId);

            // Insert test cases for this question
            for (const tc of q.test_cases) {
                await pool.query(
                    "INSERT INTO test_cases (question_id, input, expected_output, score) VALUES (?, ?, ?, ?)",
                    [questionId, tc.input, tc.expected_output, tc.score]
                );
            }
        }

        // Insert random scores and leaderboard entries
        for (let i = 0; i < playerIds.length; i++) {
            for (let j = 0; j < questionIds.length; j++) {
                const playerId = playerIds[i];
                const questionId = questionIds[j];

                // Max score per difficulty (sum of test case scores)
                let maxScore = 30;
                if (j >= 3 && j < 6) maxScore = 45;
                if (j >= 6) maxScore = 60;

                const score = Math.floor(Math.random() * (maxScore + 1));
                const language = ["Python", "JavaScript", "Java"][i % 3];
                const modifiers = ["None", "Sabotage", "Confident"];
                const modifier_state = modifiers[i % 3];

                // Insert score
                await pool.query(
                    `INSERT INTO scores (player_id, question_id, score, language, modifier_state)
                VALUES (?, ?, ?, ?, ?)`,
                    [playerId, questionId, score, language, modifier_state]
                );

                // Get inserted score id
                const [[scoreRow]] = (await pool.query<RowDataPacket[]>(
                    `SELECT score_id FROM scores WHERE player_id = ? AND question_id = ?`,
                    [playerId, questionId]
                )) as [RowDataPacket[], any];

                // Insert leaderboard entry
                await pool.query(
                    `INSERT INTO leaderboard_entries (player_id, question_id, score_id)
                VALUES (?, ?, ?)`,
                    [playerId, questionId, scoreRow.score_id]
                );
            }
        }

        console.log("✅ Seed data inserted successfully.");
    } catch (err) {
        console.error("❌ Seed failed:", err);
    } finally {
        pool.end();
    }
}

seedData();
