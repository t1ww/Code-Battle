import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("players", (table) => {
    table.increments("player_id").primary();
    table.string("player_name").notNullable();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("levels", (table) => {
    table.increments("level_id").primary();
    table.string("level_name").notNullable();
    table.text("level_description");
    table.string("difficulty");
    table.integer("time_limit");
  });

  await knex.schema.createTable("test_cases", (table) => {
    table.increments("test_case_id").primary();
    table
      .integer("level_id")
      .unsigned()
      .references("level_id")
      .inTable("levels")
      .onDelete("CASCADE");
    table.text("input_data").notNullable();
    table.text("output_data").notNullable();
    table.integer("score_value").notNullable();
  });

  await knex.schema.createTable("scores", (table) => {
    table.increments("score_id").primary();
    table.integer("total_score").notNullable();
    table.integer("time_taken").notNullable(); // assuming in seconds
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("leaderboard_entries", (table) => {
    table.increments("leaderboard_id").primary();
    table
      .integer("player_id")
      .unsigned()
      .references("player_id")
      .inTable("players")
      .onDelete("CASCADE");
    table
      .integer("level_id")
      .unsigned()
      .references("level_id")
      .inTable("levels")
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
  await knex.schema.dropTableIfExists("levels");
  await knex.schema.dropTableIfExists("players");
}
