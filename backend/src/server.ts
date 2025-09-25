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

// ✅ Root health/env check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    env: {
      PORT: !!process.env.PORT,
      FRONTEND_URL: !!process.env.FRONTEND_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at port:${PORT}`);
});
