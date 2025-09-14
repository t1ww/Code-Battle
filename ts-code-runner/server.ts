// ts-code-runner\server.ts
import express from "express";
import cors from "cors";
import runRoute from "./routes/run.route.js";

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(runRoute);

app.listen(5001, () => console.log("Server running on port 5001"));
