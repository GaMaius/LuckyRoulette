
/**
 * Lucky Strike 통합 서버 (Gun.js 릴레이 + 웹 호스팅)
 * Koyeb 배포 최적화 버전
 */
const express = require('express');
const Gun = require('gun');
const cors = require('cors');
const path = require('path');

const app = express();
// Koyeb은 환경 변수 PORT를 통해 포트를 지정합니다. 기본값 8080.
const port = process.env.PORT || 8080;

app.use(cors());
app.use(Gun.serve);

// 프론트엔드 정적 파일 서빙
app.use(express.static(path.join(__dirname, './')));

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`
  🚀 Lucky Strike All-in-One Server is Live!
  ------------------------------------------
  Port: ${port}
  Status: Production (Koyeb Mode)
  Endpoint: /gun
  ------------------------------------------
  `);
});

// Gun 인스턴스 초기화 (파일 기반 저장소 사용)
const gun = Gun({
  web: server,
  localStorage: false,
  radisk: true
});

// SPA 라우팅: /gun 이외의 모든 경로는 index.html로 연결
app.get('*', (req, res) => {
  if (req.url.startsWith('/gun')) return;
  res.sendFile(path.join(__dirname, 'index.html'));
});
