const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json({ limit: "5mb" }));
app.use(cors());

// CSVファイルの保存場所
const csvPath = path.join(__dirname, "responses.csv");

// 📌 初回作成時のみ BOM付きヘッダーをUTF-8で保存
if (!fs.existsSync(csvPath)) {
  const header = '\uFEFF' + "name,gender,age,latitude,longitude,weather,q1,q2,q3,q4,time\n";
  fs.writeFileSync(csvPath, header, "utf8");
}

// 📥 フォーム送信を受け取り CSVに追記
app.post("/upload", (req, res) => {
  const {
    name, gender, age, lat, lon, weather, q1, q2, q3, q4
  } = req.body;

  // ✅ JSTで現在時刻を保存（Excelでの可視性も良好）
  const now = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour12: false
  });

  const escape = (s) => `"${String(s || "").replace(/"/g, '""')}"`;

  const row = [
    escape(name), escape(gender), escape(age),
    lat, lon, escape(weather),
    escape(q1), escape(q2), escape(q3), escape(q4),
    now
  ].join(",") + "\n";

  fs.appendFile(csvPath, row, "utf8", (err) => {
    if (err) {
      console.error("CSV保存中にエラー:", err);
      return res.status(500).send("保存に失敗しました");
    }
    console.log("✅ CSVに保存完了！");
    res.send("保存しました！");
  });
});

// 🔁 ヘルスチェック用
app.get("/", (req, res) => {
  res.send("OK");
});

// 📄 回答一覧をHTMLテーブルで表示
app.get("/responses", (req, res) => {
  fs.readFile(csvPath, "utf8", (err, data) => {
    if (err) return res.status(500).send("CSVの読み込みに失敗しました");

    const rows = data.trim().split("\n").map(r => r.split(","));
    const headers = rows[0];
    const body = rows.slice(1);

    const html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>アンケート結果</title>
        <style>
          body { font-family: sans-serif; margin: 2em; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h2>アンケート結果一覧</h2>
        <p><a href="/download">📥 CSVファイルをダウンロード</a></p>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>
            ${body.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    res.send(html);
  });
});

// ⬇️ CSVファイルをダウンロードできるAPI
app.get("/download", (req, res) => {
  res.download(csvPath, "responses.csv");
});

// 🚀 サーバー起動
app.listen(PORT, () => {
  console.log(`📡 Server running on port ${PORT}`);
});