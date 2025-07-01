const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
const upload = multer();

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const filePath = path.join(__dirname, "responses.csv");

// 初回起動時にファイルがなければヘッダー行を作成
if (!fs.existsSync(filePath)) {
  const header = [
    "timestamp",
    "name",
    "gender",
    "age",
    "latitude",
    "longitude",
    "weather",
    "q1",
    "q2",
    "q3",
    "q4"
  ];
  fs.writeFileSync(filePath, "\uFEFF" + header.join(",") + "\n", "utf8");
}

// データ受け取り用エンドポイント
app.post("/submit", upload.none(), (req, res) => {
  const now = new Date().toISOString();
  const {
    name,
    gender,
    age,
    latitude,
    longitude,
    weather,
    q1,
    q2,
    q3,
    q4
  } = req.body;

  const row = [
    now,
    name,
    gender,
    age,
    latitude,
    longitude,
    weather,
    q1,
    q2,
    q3,
    q4
  ];

  const escaped = row.map(value => {
    const s = String(value ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  });

  fs.appendFile(filePath, escaped.join(",") + "\n", "utf8", (err) => {
    if (err) {
      console.error("❌ 書き込みエラー:", err);
      return res.status(500).send("Error saving response");
    }
    res.send("Success");
  });
});

// ダウンロード用エンドポイント
app.get("/download", (req, res) => {
  res.setHeader("Content-Disposition", "attachment; filename=responses.csv");
  res.setHeader("Content-Type", "text/csv; charset=UTF-8");
  fs.createReadStream(filePath).pipe(res);
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});