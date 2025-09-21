// backend\src\server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import playerRoutes from "@/routes/players.route";
import questionRoutes from "@/routes/question.route"
import scoreRoutes from "@/routes/score.route"

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
  
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json()); // Parse JSON
app.use("/api/players", playerRoutes); // Mount player routes
app.use("/api/questions", questionRoutes); // Mount question routes
app.use("/api/scores", scoreRoutes); // Mount score routes

app.listen(PORT, () => {
  console.log(`Server running at port:${PORT}`);
});
