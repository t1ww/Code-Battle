// ts-code-runner/src/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import runRoute from "@/routes/run.route";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(runRoute);

app.listen(PORT, () => console.log(`Runner server running on port ${PORT}`));
