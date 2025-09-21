// backend\knexfile.ts
import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
      afterCreate: (conn: any, done: any) => {
        conn.on("error", (err: any) => {
          console.error("Postgres connection error:", err);
        });
        done(null, conn);
      },
    },
    migrations: { directory: "./db/migrations" },
    seeds: { directory: "./db/seeds" },
  },
};


export default config;
