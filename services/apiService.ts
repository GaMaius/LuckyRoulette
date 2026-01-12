
import Gun from 'gun';
import { User, Message } from '../types';

/**
 * Gun.js를 사용하여 서버 없이 기기 간 실시간 데이터 공유를 구현합니다.
 * 공용 릴레이 서버(Peers)를 사용하여 Vercel 배포 후에도 모든 유저 데이터가 공유됩니다.
 */
const gun = Gun([
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun'
]);

// 데이터베이스 노드 정의
const db = gun.get('lucky-strike-v3-production');
const usersNode = db.get('users');
const messagesNode = db.get('messages');
const eventsNode = db.get('events');

class ApiService {
  // --- 사용자 관련 ---
  // 실시간 구독을 위해 콜백을 받습니다.
  subscribeUsers(callback: (users: Record<string, User>) => void) {
    usersNode.map().on((data, id) => {
      if (data) {
        // Gun.js의 메타데이터 제외 및 데이터 정제
        const { _, ...user } = data as any;
        callback({ [id]: user as User });
      }
    });
  }

  async saveUser(user: User): Promise<void> {
    usersNode.get(user.id).put(user as any);
  }

  async deleteUser(userId: string): Promise<void> {
    usersNode.get(userId).put(null as any);
  }

  // --- 채팅 관련 ---
  subscribeMessages(callback: (msg: Message) => void) {
    messagesNode.map().on((data) => {
      if (data) {
        const { _, ...msg } = data as any;
        callback(msg as Message);
      }
    });
  }

  async sendMessage(msg: Message): Promise<void> {
    messagesNode.set(msg as any);
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
    eventsNode.set(message);
  }

  // 초기 로드를 위한 헬퍼 (필요 시)
  async getUsersOnce(): Promise<Record<string, User>> {
    return new Promise((resolve) => {
      const results: Record<string, User> = {};
      usersNode.once((data) => {
        // 단일 노드 로드 시 map()으로 처리 필요
      });
      // Gun은 비동기 스트림이므로 구독 방식을 권장합니다.
      resolve(results);
    });
  }
}

export const api = new ApiService();

// 현재는 Gun.js 내부에서 직접 처리하므로 헬퍼 함수는 간소화
export const getLiveActivity = async () => {
  return "실시간 데이터 동기화 중...";
};
