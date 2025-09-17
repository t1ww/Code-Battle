// backend\src\server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import playerRoutes from "@/routes/players.route";
import questionRoutes from "@/routes/question.route";
import scoreRoutes from "@/routes/score.route";

dotenv.config();

// Log environment variables to verify
console.log("[ENV] PORT:", process.env.PORT);
console.log("[ENV] DB_HOST:", process.env.DB_HOST);
console.log("[ENV] DB_PORT:", process.env.DB_PORT);
console.log("[ENV] DB_USER:", process.env.DB_USER);
console.log("[ENV] DB_NAME:", process.env.DB_NAME);
console.log("[ENV] FRONTEND_URL:", process.env.FRONTEND_URL);

const app = express();
const PORT = process.env.PORT || 5000;

// Fallback to localhost for local development
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use("/api/players", playerRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/scores", scoreRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
