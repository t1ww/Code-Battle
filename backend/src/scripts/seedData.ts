// backend\src\scripts\seedData.ts
import knex from "@/clients/knex.client";
import bcrypt from "bcrypt";

async function seedData() {
  try {
    // Prepare players data
    const playersData: [string, string, string][] = Array.from({ length: 9 }, (_, i) => [
      `user${i + 1}`,
      `user${i + 1}@example.com`,
      "123456",
    ]);

    const playerIds: number[] = [];

    // Insert players
    for (const [name, email, plainPw] of playersData) {
      const hashedPw = await bcrypt.hash(plainPw, 10);
      const [insertedPlayer] = await knex("players")
        .insert({ player_name: name, email, password_hash: hashedPw })
        .returning<{ player_id: number }[]>("player_id");

      playerIds.push(insertedPlayer.player_id);
    }

    // Questions with real test cases
    const questionsData = [
      // Easy
      {
        name: "Sum Two Numbers",
        description: "Given two numbers, return their sum.",
        time_limit: 300,
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
        time_limit: 300,
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
        time_limit: 300,
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
        time_limit: 900,
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
        time_limit: 900,
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
        time_limit: 900,
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
        description: "Given a list of intervals, merge all overlapping intervals and return the result.",
        time_limit: 1800,
        level: "Hard",
        test_cases: [
          {
            input: "[[1,3],[2,6],[8,10],[15,18]]",
            expected_output: "[[1,6],[8,10],[15,18]]",
            score: 20,
          },
          { input: "[[1,4],[4,5]]", expected_output: "[[1,5]]", score: 20 },
          { input: "[]", expected_output: "[]", score: 20 },
        ],
      },
      {
        name: "Longest Substring Without Repeating",
        description: "Given a string, find the length of the longest substring without repeating characters.",
        time_limit: 1800,
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
        time_limit: 1800,
        level: "Hard",
        test_cases: [
          { input: "hit cog [hot dot dog lot log]", expected_output: "5", score: 20 },
          { input: "hit cog [hot dot dog lot log hog]", expected_output: "4", score: 20 },
          { input: "hit hit [hot dot dog]", expected_output: "1", score: 20 },
        ],
      },
    ];

    const questionIds: number[] = [];

    // Insert questions + test cases
    for (const q of questionsData) {
      const [insertedQuestion] = await knex("questions")
        .insert({
          question_name: q.name,
          description: q.description,
          time_limit: q.time_limit,
          level: q.level,
        })
        .returning<{ question_id: number }[]>("question_id");

      questionIds.push(insertedQuestion.question_id);

      for (const tc of q.test_cases) {
        await knex("test_cases").insert({
          question_id: insertedQuestion.question_id,
          input: tc.input,
          expected_output: tc.expected_output,
          score: tc.score,
        });
      }
    }

    // Insert random scores + leaderboard entries
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = 0; j < questionIds.length; j++) {
        const playerId = playerIds[i];
        const questionId = questionIds[j];

        let maxScore = 30;
        if (j >= 3 && j < 6) maxScore = 45;
        if (j >= 6) maxScore = 60;

        const score = Math.floor(Math.random() * (maxScore + 1));
        const language = ["Python", "JavaScript", "Java"][i % 3];
        const modifier_state = ["None", "Sabotage", "Confident"][i % 3];

        const [insertedScore] = await knex("scores")
          .insert({
            player_id: playerId,
            question_id: questionId,
            score,
            language,
            modifier_state,
          })
          .returning<{ score_id: number }[]>("score_id");

        await knex("leaderboard_entries").insert({
          player_id: playerId,
          question_id: questionId,
          score_id: insertedScore.score_id,
        });
      }
    }

    console.log("✅ Seed data inserted successfully.");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await knex.destroy();
  }
}

seedData();
