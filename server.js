const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

// 💡 JSONサイズ制限を5MBに拡張
app.use(express.json({ limit: "5mb" }));
app.use(cors());

// CSVファイルのパス
const csvPath = path.join(__dirname, "responses.csv");

// 初期ヘッダー（ファイルがないときに作成）
if (!fs.existsSync(csvPath)) {
  fs.writeFileSync(
    csvPath,
    "name,gender,age,latitude,longitude,weather,q1,q2,q3,q4,time\n",
    "utf8"
  );
}

// POSTリクエスト受け取り
app.post("/upload", (req, res) => {
  const {
    name,
    gender,
    age,
    lat,
    lon,
    weather,
    q1,
    q2,
    q3,
    q4
  } = req.body;

  const now = new Date().toISOString();

  // 各フィールドをCSVに合わせてエスケープ
  const escape = (s) => `"${String(s || "").replace(/"/g, '""')}"`;

  const row = [
    escape(name),
    escape(gender),
    escape(age),
    lat,
    lon,
    escape(weather),
    escape(q1),
    escape(q2),
    escape(q3),
    escape(q4),
    now
  ].join(",") + "\n";

  fs.appendFile(csvPath, row, (err) => {
    if (err) {
      console.error("CSV保存中にエラー:", err);
      return res.status(500).send("保存に失敗しました");
    }
    console.log("✅ CSVに保存完了！");
    res.send("保存しました！");
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`📡 Server running on port ${PORT}`);
});