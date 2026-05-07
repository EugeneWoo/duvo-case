import express from "express";
import cors from "cors";
import "dotenv/config";
import { runAgentWithRetry } from "./agent.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await runAgentWithRetry(message);
    res.json({ response });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({
      error: "Our friendly AI agent is feeling out of sorts. Please try again later.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
