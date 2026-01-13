
/**
 * Lucky Strike 통합 서버 (Gun.js 릴레이 + 웹 호스팅)
 * Koyeb 배포 최적화 버전 (Build Step 포함)
 */
const express = require('express');
const Gun = require('gun');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(Gun.serve);

// 루트 디렉토리의 모든 파일(빌드된 index.js 포함) 서빙
app.use(express.static(__dirname));

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`
  🚀 Lucky Strike All-in-One Server is Live!
  ------------------------------------------
  Port: ${port}
  Status: Production (Koyeb Optimized)
  Endpoint: /gun
  ------------------------------------------
  `);
});

const gun = Gun({
  web: server,
  localStorage: false,
  radisk: true
});

// SPA 라우팅 대응: 존재하지 않는 경로는 index.html로 리다이렉트
app.get('*', (req, res) => {
  if (req.url.startsWith('/gun')) return;
  // 빌드된 파일들이나 정적 에셋은 express.static에서 먼저 처리됨
  res.sendFile(path.join(__dirname, 'index.html'));
});
