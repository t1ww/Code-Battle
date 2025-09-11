// backend\src\scripts\resetData.ts
import knex from "@/clients/knex.client";

async function resetData() {
  try {
    await knex.raw(`
      TRUNCATE TABLE 
        leaderboard_entries, 
        scores, 
        test_cases, 
        players 
      RESTART IDENTITY CASCADE
    `);

    console.log("✅ Database data reset.");
  } catch (err) {
    console.error("❌ Reset failed:", err);
  } finally {
    await knex.destroy();
  }
}

resetData();