import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BEU Result Proxy is running");
});

app.get("/api/beu-result", async (req, res) => {
  const { year, reg, sem, exam } = req.query;

  if (!year || !reg || !sem || !exam) {
    return res.status(400).json({
      status: false,
      message: "Missing required parameters"
    });
  }

  const beuURL =
    "https://beu-bih.ac.in/backend/v1/result/get-result" +
    `?year=${year}` +
    `&redg_no=${reg}` +
    `&semester=${sem}` +
    `&exam_held=${encodeURIComponent(exam)}`;

  try {
    const response = await fetch(beuURL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("BEU server error");
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("FETCH ERROR:", err.message);
    res.status(500).json({
      status: false,
      message: "Failed to fetch BEU result"
    });
  }
});

app.listen(PORT, () => {
  console.log("Proxy server running on port", PORT);
});
