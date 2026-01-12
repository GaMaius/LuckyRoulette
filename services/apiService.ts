
import Gun from 'gun';
import { User, Message, SharedMedia } from '../types';

/**
 * Vercel 서버리스 환경을 위한 피어 구성
 * 1. 로컬 개발 환경: localhost:8765
 * 2. 배포 환경: 환경 변수(NEXT_PUBLIC_GUN_PEERS) 또는 공용 커뮤니티 서버
 */
const getPeers = () => {
  // 개발 모드인 경우 로컬 서버를 우선순위에 둡니다.
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return ['http://localhost:8765/gun'];
  }

  // Vercel 환경 변수에서 피어를 가져오거나 기본 공용 피어를 사용합니다.
  // 주의: Vercel(HTTPS) 환경에서는 반드시 https 피어만 사용해야 Mixed Content 에러가 발생하지 않습니다.
  const envPeers = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GUN_PEERS) 
    ? process.env.NEXT_PUBLIC_GUN_PEERS.split(',') 
    : [
        'https://gun-manhattan.herokuapp.com/gun',
        'https://gun-us.herokuapp.com/gun',
        'https://gunjs.herokuapp.com/gun',
        'https://gundb-relay.up.railway.app/gun' // 추가적인 공용 피어
      ];

  return envPeers;
};

const gun = Gun({
  peers: getPeers(),
  localStorage: true, // 브라우저 IndexedDB/LocalStorage에 데이터 캐싱
  radisk: true        // 성능 최적화
});

const DB_NAME = 'lucky-strike-global-v103-prod';
const db = gun.get(DB_NAME);

// 데이터 노드 정의
const usersNode = db.get('users');
const messagesNode = db.get('messages');
const eventsNode = db.get('events');
const sharedGalleryNode = db.get('shared-gallery');

class ApiService {
  // --- 사용자 관련 ---
  subscribeUsers(callback: (users: Record<string, User>) => void) {
    usersNode.map().on((data, id) => {
      if (data) {
        const { _, ...user } = data as any;
        if (user && user.id) callback({ [id]: user as User });
      }
    });
  }

  async saveUser(user: User): Promise<void> {
    const cleanUser = JSON.parse(JSON.stringify(user));
    return new Promise((resolve) => {
      usersNode.get(user.id).put(cleanUser, (ack: any) => {
        if (!ack.err) resolve();
      });
    });
  }

  // --- 공유 갤러리 ---
  subscribeSharedGallery(callback: (media: SharedMedia) => void) {
    sharedGalleryNode.map().on((data) => {
      if (data && data.id) {
        const { _, ...media } = data as any;
        callback(media as SharedMedia);
      }
    });
  }

  async uploadToSharedGallery(media: SharedMedia): Promise<void> {
    const cleanMedia = JSON.parse(JSON.stringify(media));
    return new Promise((resolve) => {
      sharedGalleryNode.get(media.id).put(cleanMedia, () => resolve());
    });
  }

  // --- 채팅 ---
  subscribeMessages(callback: (msg: Message) => void) {
    messagesNode.map().on((data) => {
      if (data && data.id) {
        const { _, ...msg } = data as any;
        callback(msg as Message);
      }
    });
  }

  async sendMessage(msg: Message): Promise<void> {
    const cleanMsg = JSON.parse(JSON.stringify(msg));
    messagesNode.get(msg.id).put(cleanMsg);
  }

  // --- 실시간 이벤트 ---
  subscribeEvents(callback: (event: string) => void) {
    eventsNode.map().on((data) => {
      if (typeof data === 'string') callback(data);
    });
  }

  async logEvent(message: string): Promise<void> {
    eventsNode.set(message);
  }

  async deleteUser(userId: string): Promise<void> {
    usersNode.get(userId).put(null as any);
  }
}

export const api = new ApiService();
