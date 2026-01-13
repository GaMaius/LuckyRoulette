const express = require('express');
const Gun = require('gun');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());

// 정적 파일 서빙 (빌드된 index.js 및 index.html)
app.use(express.static(path.join(__dirname)));

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Lucky Strike Server is running on port ${port}`);
});

// Gun.js P2P Relay 설정
const gun = Gun({
  web: server,
  localStorage: false,
  radisk: true
});

// SPA 라우팅 대응
app.get('*', (req, res) => {
  if (req.url.startsWith('/gun')) return;
  res.sendFile(path.join(__dirname, 'index.html'));
});