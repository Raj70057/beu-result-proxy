import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("BEU Result Proxy is running");
});

/* ---------- Grade → Point ---------- */
const gradePoints = {
  "O": 10,
  "A+": 9,
  "A": 8,
  "B+": 7,
  "B": 6,
  "C": 5,
  "F": 0
};

const SEMESTERS = ["I","II","III","IV","V","VI","VII","VIII"];

/* ---------- SGPA calculator ---------- */
function calculateSGPA(subjects = []) {
  let totalCredits = 0;
  let totalPoints = 0;

  subjects.forEach(sub => {
    const credit = Number(sub.credit) || 0;
    const grade = sub.grade;
    const point = gradePoints[grade] ?? 0;

    totalCredits += credit;
    totalPoints += credit * point;
  });

  if (!totalCredits) return null;
  return (totalPoints / totalCredits).toFixed(2);
}

/* ---------- Fetch one semester ---------- */
async function fetchSemester({ year, reg, sem, exam }) {
  const url =
    `https://beu-bih.ac.in/backend/v1/result/get-result` +
    `?year=${year}&redg_no=${reg}&semester=${sem}&exam_held=${encodeURIComponent(exam)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const json = await res.json();
  if (!json || json.status !== 200) return null;
  return json.data;
}

/* ---------- MAIN API ---------- */
app.get("/api/beu-result", async (req, res) => {
  const { year, reg, sem, exam } = req.query;

  if (!year || !reg || !sem || !exam) {
    return res.status(400).json({
      status: 400,
      message: "Missing required parameters"
    });
  }

  try {
    /* ---------- Current semester ---------- */
    const currentData = await fetchSemester({ year, reg, sem, exam });

    if (!currentData) {
      return res.json({ status: 404, message: "Result not found" });
    }

    /* ---------- All semester SGPA ---------- */
    const semesterWiseSGPA = [];

    for (const s of SEMESTERS) {
      const semData = await fetchSemester({
        year,
        reg,
        sem: s,
        exam
      });

      if (!semData) continue;

      const subjects = [
        ...(semData.theorySubjects || []),
        ...(semData.practicalSubjects || [])
      ];

      const sgpa = calculateSGPA(subjects);
      if (sgpa) {
        semesterWiseSGPA.push({
          semester: s,
          sgpa
        });
      }
    }

    /* ---------- Current SGPA ---------- */
    const currentSubjects = [
      ...(currentData.theorySubjects || []),
      ...(currentData.practicalSubjects || [])
    ];
    const currentSGPA = calculateSGPA(currentSubjects);

    /* ---------- Final response ---------- */
    res.json({
      status: 200,
      data: {
        ...currentData,
        sgpa: currentSGPA,
        cgpa: currentData.cgpa || null,
        semester_wise_sgpa: semesterWiseSGPA
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
