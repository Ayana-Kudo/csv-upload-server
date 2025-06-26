// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/upload', (req, res) => {
  const data = req.body;

  // CSVの1行を作成
  const values = [
    new Date().toLocaleString(),
    data.name,
    data.gender,
    data.age,
    data.lat,
    data.lon,
    data.weather,
    data.q1,
    data.q2,
    data.q3,
    data.q4
  ];

  const csvLine = `"${values.map(v => (v ?? '').toString().replace(/"/g, '""')).join('","')}"\n`;

  // ファイルに追記（CSVがなければ新しく作る）
  const filePath = './responses.csv';
  if (!fs.existsSync(filePath)) {
    const headers = '"日時","名前","性別","年齢","緯度","経度","天気","Q1","Q2","Q3","Q4"\n';
    fs.writeFileSync(filePath, headers + csvLine);
  } else {
    fs.appendFileSync(filePath, csvLine);
  }

  res.send('CSVに保存しました！');
});

app.get('/', (req, res) => {
  res.send('CSVアンケート保存サーバー稼働中！');
});

app.listen(PORT, () => {
  console.log(`📡 Listening on port ${PORT}`);
});