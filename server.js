import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("BEU Result Proxy is running");
});

app.get("/api/beu-result", async (req, res) => {
  const { year, reg, sem, exam } = req.query;

  if (!year || !reg || !sem || !exam) {
    return res.status(400).json({
      error: "Missing required parameters"
    });
  }

  const beuURL =
    `https://beu-bih.ac.in/backend/v1/result/get-result` +
    `?year=${year}&redg_no=${reg}&semester=${sem}&exam_held=${encodeURIComponent(exam)}`;

  try {
    const response = await fetch(beuURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch BEU result"
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
