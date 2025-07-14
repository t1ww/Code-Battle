import pool from "@/clients/database.client"; // adjust the path if needed
import dotenv from "dotenv";
dotenv.config();

async function resetData() {
  try {
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");

    // Truncate all tables in correct order (children first)
    await pool.query("TRUNCATE TABLE leaderboard_entries");
    await pool.query("TRUNCATE TABLE scores");
    await pool.query("TRUNCATE TABLE test_cases");
    await pool.query("TRUNCATE TABLE levels");
    await pool.query("TRUNCATE TABLE players");

    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("✅ Database data reset.");
  } catch (err) {
    console.error("❌ Reset failed:", err);
  } finally {
    pool.end(); // close pool after all queries
  }
}

resetData();
