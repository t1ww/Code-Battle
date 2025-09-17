// backend\src\clients\knex.client.ts
import knexConfig from "../../knexfile";
import Knex from "knex";

const knex = Knex(knexConfig.development);

export default knex;
