
const express = require('express');
const Gun = require('gun');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(Gun.serve);

// 빌드된 정적 에셋 서빙
app.use(express.static(__dirname));

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Lucky Strike Server running on port ${port}`);
});

// Gun.js P2P Relay
const gun = Gun({
  web: server,
  localStorage: false,
  radisk: true
});

// SPA Routing: 모든 GET 요청을 index.html로 (API/Gun 경로 제외)
app.get('*', (req, res) => {
  if (req.url.startsWith('/gun')) return;
  res.sendFile(path.join(__dirname, 'index.html'));
});
