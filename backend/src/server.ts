// backend\src\server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import playerRoutes from "@/routes/players.route";
import questionRoutes from "@/routes/question.route"
import scoreRoutes from "@/routes/score.route"

dotenv.config();
// Log environment variables to verify
console.log("[ENV] PORT:", process.env.PORT);
console.log("[ENV] DB_HOST:", process.env.DB_HOST);
console.log("[ENV] DB_PORT:", process.env.DB_PORT);
console.log("[ENV] DB_USER:", process.env.DB_USER);
console.log("[ENV] DB_NAME:", process.env.DB_NAME);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json()); // Parse JSON
app.use("/api/players", playerRoutes); // Mount player routes
app.use("/api/questions", questionRoutes); // Mount question routes
app.use("/api/scores", scoreRoutes); // Mount score routes

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
