const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

// 📂 画像保存用フォルダ（事前に作っておこう！）
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.use(express.static("public")); // ここで public 配下のHTMLを公開！

// 📄 CSVファイルの準備
const csvPath = path.join(__dirname, "responses.csv");
if (!fs.existsSync(csvPath)) {
  fs.writeFileSync(
    csvPath,
    "name,gender,age,latitude,longitude,weather,q1,q2,q3,q4,photo,time\n",
    "utf8"
  );
}

// 📥 アップロード処理（画像 + アンケートデータ）
app.post("/upload", (req, res) => {
  console.log("📨 受信したデータ:", JSON.stringify(req.body).slice(0, 300));

  const {
    name, gender, age, lat, lon,
    weather, q1, q2, q3, q4,
    photo // base64画像データ（data:image/... 形式）
  } = req.body;

  const now = new Date().toISOString();
  const timestamp = now.replace(/[:.]/g, "-");
  let imageFileName = "";

  // 📷 画像保存（photoがあるときだけ）
  if (photo) {
    try {
      imageFileName = `photo-${timestamp}.jpg`;
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const imagePath = path.join(uploadsDir, imageFileName);

      fs.writeFileSync(imagePath, buffer);
      console.log("📸 画像を保存しました:", imageFileName);
    } catch (err) {
      console.error("❌ 画像保存エラー:", err.message);
      imageFileName = "";
    }
  }

  // 📊 CSVに保存
  const escape = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
  const row = [
    escape(name), escape(gender), escape(age),
    lat, lon, escape(weather),
    escape(q1), escape(q2), escape(q3), escape(q4),
    imageFileName,
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

// 💻 HTML一覧表示＆CSVダウンロード
app.get("/", (req, res) => res.send("OK"));

app.get("/responses", (req, res) => {
  fs.readFile(csvPath, "utf8", (err, data) => {
    if (err) return res.status(500).send("CSVの読み込みに失敗しました");

    const rows = data.trim().split("\n").map(r => r.split(","));
    const headers = rows[0];
    const body = rows.slice(1);

    const html = `
      <html><head><meta charset="UTF-8"><title>アンケート結果</title>
      <style>body{font-family:sans-serif;margin:2em;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}th{background:#f4f4f4}</style>
      </head><body>
        <h2>アンケート結果一覧</h2>
        <p><a href="/download" download>📥 CSVダウンロード</a></p>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>
            ${body.map(row => `<tr>${row.map((cell, i) =>
              i === 10 && cell ? `<td><a href="/uploads/${cell}" target="_blank">画像📷</a></td>` : `<td>${cell}</td>`
            ).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body></html>
    `;
    res.send(html);
  });
});

app.get("/download", (req, res) => {
  res.download(csvPath, "responses.csv");
});

// 🚀 起動
app.listen(PORT, () => {
  console.log(`📡 Server running on port ${PORT}`);
});