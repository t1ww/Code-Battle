import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import playerRoutes from "@/routes/players.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json()); // Parse JSON
app.use("/players", playerRoutes); // Mount player routes

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
