import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Players table
  await knex.schema.createTable("players", (table) => {
    table.increments("player_id").primary();
    table.string("player_name").notNullable();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Questions table
  await knex.schema.createTable("questions", (table) => {
    table.increments("question_id").primary();
    table.string("question_name").notNullable();
    table.text("description").notNullable();
    table.integer("time_limit").notNullable(); // seconds
    table.enum("level", ["Easy", "Medium", "Hard"]).notNullable(); // enum for difficulty
  });

  // Test Cases table
  await knex.schema.createTable("test_cases", (table) => {
    table.increments("test_case_id").primary();
    table
      .integer("question_id")
      .unsigned()
      .references("question_id")
      .inTable("questions")
      .onDelete("CASCADE");
    table.text("input").notNullable();
    table.text("expected_output").notNullable();
    table.integer("score").notNullable();
  });

  // Scores table
  await knex.schema.createTable("scores", (table) => {
    table.increments("score_id").primary();

    table
      .integer("player_id")
      .unsigned()
      .references("player_id")
      .inTable("players")
      .onDelete("CASCADE");

    table
      .integer("question_id")
      .unsigned()
      .references("question_id")
      .inTable("questions")
      .onDelete("CASCADE");

    table.integer("score").notNullable(); // replaces 'total_score'
    table.string("language").notNullable().defaultTo("unknown");
    table.string("modifier_state").notNullable().defaultTo("default");

    table.integer("time_taken").notNullable(); // if you're still tracking it
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.unique(["player_id", "question_id"]); // one score per player per question
  });

  // Leaderboard entries table
  await knex.schema.createTable("leaderboard_entries", (table) => {
    table.increments("leaderboard_id").primary();
    table
      .integer("player_id")
      .unsigned()
      .references("player_id")
      .inTable("players")
      .onDelete("CASCADE");
    table
      .integer("question_id")
      .unsigned()
      .references("question_id")
      .inTable("questions")
      .onDelete("CASCADE");
    table
      .integer("score_id")
      .unsigned()
      .references("score_id")
      .inTable("scores")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("leaderboard_entries");
  await knex.schema.dropTableIfExists("scores");
  await knex.schema.dropTableIfExists("test_cases");
  await knex.schema.dropTableIfExists("questions");
  await knex.schema.dropTableIfExists("players");
}
