
const express = require('express');
const Gun = require('gun');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8765;

// 모든 도메인에서의 접속을 허용 (CORS 설정)
app.use(cors());
app.use(Gun.serve);

const server = app.listen(port, () => {
  console.log(`🚀 Lucky Strike Relay Server 가 포트 ${port}에서 작동 중입니다.`);
});

// Gun.js 인스턴스 초기화
const gun = Gun({
  web: server,
  localStorage: false // 서버이므로 로컬 스토리지는 사용하지 않음
});

console.log('🔗 Gun Relay Peer 가 활성화되었습니다.');
