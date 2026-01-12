
import Gun from 'gun';
import { User, Message, SharedMedia } from '../types';

/**
 * 2025년 기준 비교적 가동률이 높은 Gun.js 릴레이 피어 리스트
 * 404 에러가 뜨더라도 WebSocket(wss)은 작동하는 경우가 많으므로 직접 연결합니다.
 */
const PEER_LIST = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun',
  'https://gundb.com/gun',
  'https://gun-us.herokuapp.com/gun',
  'https://gun-ams1.marda.io/gun',
  'https://gundb-relay.up.railway.app/gun'
];

let gunInstance: any = null;
let connectedPeers: Set<string> = new Set();
let statusCallback: ((count: number) => void) | null = null;

class ApiService {
  private dbName = 'lucky-strike-v105-mesh';

  /**
   * Gun 인스턴스 초기화 및 이벤트 바인딩
   */
  async init(): Promise<void> {
    if (gunInstance) return;

    // 환경 변수에 사용자 정의 피어가 있다면 추가
    const customPeers = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GUN_PEERS) 
      ? process.env.NEXT_PUBLIC_GUN_PEERS.split(',') 
      : [];
    
    const finalPeers = [...new Set([...customPeers, ...PEER_LIST])];

    gunInstance = Gun({
      peers: finalPeers,
      localStorage: true,
      radisk: true,
      retry: 1000 // 재연결 시도 간격
    });

    // 실제 연결된 피어 모니터링
    gunInstance.on('hi', (peer: any) => {
      console.log('✅ Peer Connected:', peer.url);
      connectedPeers.add(peer.url);
      this.notifyStatus();
    });

    gunInstance.on('bye', (peer: any) => {
      console.log('❌ Peer Disconnected:', peer.url);
      connectedPeers.delete(peer.url);
      this.notifyStatus();
    });
  }

  private notifyStatus() {
    if (statusCallback) {
      statusCallback(connectedPeers.size);
    }
  }

  /**
   * 연결된 피어 수 구독
   */
  onConnectionChange(callback: (count: number) => void) {
    statusCallback = callback;
    callback(connectedPeers.size);
  }

  private get db() {
    if (!gunInstance) this.init();
    return gunInstance.get(this.dbName);
  }

  private get nodes() {
    return {
      users: this.db.get('users'),
      messages: this.db.get('messages'),
      events: this.db.get('events'),
      sharedGallery: this.db.get('shared-gallery')
    };
  }

  // --- 기존 API 메서드 유지 ---
  subscribeUsers(callback: (users: Record<string, User>) => void) {
    this.nodes.users.map().on((data: any, id: string) => {
      if (data) {
        const { _, ...user } = data;
        if (user && user.id) callback({ [id]: user as User });
      }
    });
  }

  async saveUser(user: User): Promise<void> {
    const cleanUser = JSON.parse(JSON.stringify(user));
    return new Promise((resolve) => {
      this.nodes.users.get(user.id).put(cleanUser, (ack: any) => {
        if (!ack.err) resolve();
      });
    });
  }

  subscribeSharedGallery(callback: (media: SharedMedia) => void) {
    this.nodes.sharedGallery.map().on((data: any) => {
      if (data && data.id) {
        const { _, ...media } = data;
        callback(media as SharedMedia);
      }
    });
  }

  async uploadToSharedGallery(media: SharedMedia): Promise<void> {
    const cleanMedia = JSON.parse(JSON.stringify(media));
    this.nodes.sharedGallery.get(media.id).put(cleanMedia);
  }

  subscribeMessages(callback: (msg: Message) => void) {
    this.nodes.messages.map().on((data: any) => {
      if (data && data.id) {
        const { _, ...msg } = data;
        callback(msg as Message);
      }
    });
  }

  async sendMessage(msg: Message): Promise<void> {
    const cleanMsg = JSON.parse(JSON.stringify(msg));
    this.nodes.messages.get(msg.id).put(cleanMsg);
  }

  subscribeEvents(callback: (event: string) => void) {
    this.nodes.events.map().on((data: any) => {
      if (typeof data === 'string') callback(data);
    });
  }

  async logEvent(message: string): Promise<void> {
    this.nodes.events.set(message);
  }

  async deleteUser(userId: string): Promise<void> {
    this.nodes.users.get(userId).put(null as any);
  }
}

export const api = new ApiService();
