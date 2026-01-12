
/**
 * Lucky Strike 전용 Gun.js 릴레이 서버
 * Render.com, Railway.app, DigitalOcean 등에 배포 가능
 */
const express = require('express');
const Gun = require('gun');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8765;

// 모든 오리진에서의 접속 허용 (Vercel 클라이언트 지원용)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Gun.js 라이브러리 서빙
app.use(Gun.serve);

const server = app.listen(port, () => {
  console.log(`
  🚀 Lucky Strike Dedicated Relay Server
  --------------------------------------
  Port: ${port}
  Status: Running
  Endpoint: /gun
  --------------------------------------
  `);
});

// Gun 인스턴스 초기화 (서버측 데이터 영속성 강화)
const gun = Gun({
  web: server,
  localStorage: false, // 서버에서는 파일 시스템(Radisk)을 주로 사용
  radisk: true,
  chunk: 1024 * 1024 // 전송 청크 최적화
});

// 상태 확인용 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', peers: Object.keys(gun._.opt.peers).length });
});

app.get('/', (req, res) => {
  res.send('<h1>Lucky Strike P2P Relay Server is Active</h1>');
});

console.log('🔗 Peer-to-Peer Mesh Network Listener Active.');
