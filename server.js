const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

// 📄 CSVファイルの準備
const csvPath = path.join(__dirname, "responses.csv");
if (!fs.existsSync(csvPath)) {
  fs.writeFileSync(
    csvPath,
    "timestamp,name,gender,age,latitude,longitude,weather,q1,q2,q3,q4\n",
    "utf8"
  );
}

app.use(express.json({ limit: "5mb" }));
app.use(cors());

// 📥 アップロード処理（アンケートのみ）
app.post("/upload", (req, res) => {
  const {
    name, gender, age, lat, lon,
    weather, q1, q2, q3, q4
  } = req.body;

  const now = new Date().toISOString();

  const escape = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
  const row = [
    now, name, gender, age,
    lat, lon, weather,
    q1, q2, q3, q4
  ].map(escape).join(",") + "\n";

  fs.appendFile(csvPath, row, (err) => {
    if (err) {
      console.error("❌ CSV保存エラー:", err.message);
      return res.status(500).send("保存に失敗しました");
    }
    console.log("✅ CSV保存完了");
    res.send("保存しました！");
  });
});

// 📤 ダウンロードエンドポイント
app.get("/download", (req, res) => {
  if (!fs.existsSync(csvPath)) {
    return res.status(404).send("CSVが存在しません");
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.download(csvPath, "responses.csv");
});

// 🚀 サーバー起動
app.listen(PORT, () => {
  console.log(`📡 Server running on port ${PORT}`);
});