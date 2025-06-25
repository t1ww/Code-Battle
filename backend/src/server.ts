import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import playerRoutes from "./routes/players";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Parse JSON
app.use("/players", playerRoutes); // Mount player routes

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
