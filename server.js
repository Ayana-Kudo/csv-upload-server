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
app.use(express.urlencoded({ extended: true, limit:'10mb' }));
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));

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
    "q4",
    "imageFile"
  ];
  fs.writeFileSync(filePath, "\uFEFF" + header.join(",") + "\n", "utf8");
}

// データ受け取り用エンドポイント
app.post("/submit", upload.none(), (req, res) => {
  const now = new Date().toISOString();
  const timestamp = Date.now(); // 画像ファイル用

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
    q4,
    image
  } = req.body;

    const imageFileName = `img_${timestamp}.png`;

  // 画像保存
  if (image) {
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const imagePath = path.join(__dirname, "images", imageFileName);
    fs.writeFile(imagePath, base64Data, "base64", (err) => {
      if (err) console.error("❌ 画像保存エラー:", err);
    });
  }

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
    q4,
    imageFileName
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