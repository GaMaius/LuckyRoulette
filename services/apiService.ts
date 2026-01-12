
import Gun from 'gun';
import { User, Message } from '../types';

/**
 * Gun.js P2P 동기화 엔진
 * 릴레이 서버를 다중화하여 기기 간 동기화 확률을 극대화합니다.
 */
const peers = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun',
  'https://d109fec50d8b.ngrok.app/gun' // 임시 테스트용 피어 추가 가능
];

const gun = Gun({
  peers: peers,
  localStorage: true, // 로컬 캐싱 유지
  radisk: true       // 스토리지 최적화
});

// 고유한 DB 루트 노드 (충돌 방지를 위해 유니크하게 설정)
const DB_NAME = 'lucky-strike-pro-cloud-sync-v101';
const db = gun.get(DB_NAME);
const usersNode = db.get('users');
const messagesNode = db.get('messages');
const eventsNode = db.get('events');

class ApiService {
  // --- 사용자 관련 ---
  subscribeUsers(callback: (users: Record<string, User>) => void) {
    usersNode.map().on((data, id) => {
      if (data) {
        // Gun 메타데이터 제거 및 순수 데이터 추출
        const { _, ...user } = data as any;
        if (user && user.id) {
          callback({ [id]: user as User });
        }
      }
    });
  }

  async saveUser(user: User): Promise<void> {
    // Gun.js는 순수 JSON 객체를 선호하므로 직렬화 후 저장
    const cleanUser = JSON.parse(JSON.stringify(user));
    return new Promise((resolve) => {
      usersNode.get(user.id).put(cleanUser, (ack: any) => {
        if (!ack.err) resolve();
      });
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return new Promise((resolve) => {
      usersNode.get(userId).put(null as any, () => resolve());
    });
  }

  // --- 채팅 관련 ---
  subscribeMessages(callback: (msg: Message) => void) {
    messagesNode.map().on((data) => {
      if (data) {
        const { _, ...msg } = data as any;
        if (msg && msg.id) {
          callback(msg as Message);
        }
      }
    });
  }

  async sendMessage(msg: Message): Promise<void> {
    const cleanMsg = JSON.parse(JSON.stringify(msg));
    return new Promise((resolve) => {
      messagesNode.get(msg.id).put(cleanMsg, () => resolve());
    });
  }

  // --- 실시간 이벤트 로그 관련 ---
  subscribeEvents(callback: (event: string) => void) {
    eventsNode.map().on((data) => {
      if (typeof data === 'string') {
        callback(data);
      }
    });
  }

  async logEvent(message: string): Promise<void> {
    // 이벤트는 고유 키 없이 set으로 순차 추가
    eventsNode.set(message);
  }
}

export const api = new ApiService();

export const getLiveActivity = async () => {
  return "클라우드 동기화 활성화됨";
};
