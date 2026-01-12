
import Gun from 'gun';
import { User, Message, SharedMedia, ConnectionStatus } from '../types';

/**
 * 비교적 안정적인 최신 공용/커뮤니티 피어 리스트
 */
const POTENTIAL_PEERS = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun',
  'https://gun-ams1.marda.io/gun',
  'https://gun-sjc1.marda.io/gun',
  'https://gundb-relay.up.railway.app/gun'
];

let gunInstance: any = null;

class ApiService {
  private activePeers: string[] = [];
  private dbName = 'lucky-strike-v104-secure';

  /**
   * 피어들의 생존 여부를 HTTP GET으로 먼저 체크합니다.
   */
  async checkPeers(): Promise<string[]> {
    const customPeers = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GUN_PEERS) 
      ? process.env.NEXT_PUBLIC_GUN_PEERS.split(',') 
      : [];
    
    const allCandidates = [...new Set([...customPeers, ...POTENTIAL_PEERS])];
    const available: string[] = [];

    await Promise.all(
      allCandidates.map(async (url) => {
        try {
          // timeout 2초 설정으로 빠른 필터링
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 2000);
          
          const response = await fetch(url.replace('/gun', ''), { 
            method: 'GET', 
            signal: controller.signal,
            mode: 'no-cors' // 대부분의 릴레이는 CORS가 막혀있을 수 있어 no-cors로 생존만 확인
          });
          
          available.push(url);
          clearTimeout(id);
        } catch (e) {
          console.warn(`⚠️ Peer Offline: ${url}`);
        }
      })
    );

    this.activePeers = available;
    return available;
  }

  /**
   * Gun 인스턴스를 안전하게 초기화합니다.
   */
  async init(): Promise<ConnectionStatus> {
    const peers = await this.checkPeers();
    
    // 이미 인스턴스가 있다면 피어만 추가
    if (!gunInstance) {
      gunInstance = Gun({
        peers: peers,
        localStorage: true,
        radisk: true
      });
    } else {
      // 동적으로 살아있는 피어 추가
      peers.forEach(p => gunInstance.opt({ peers: [p] }));
    }

    return {
      connected: peers.length > 0,
      activePeers: peers,
      isLocalOnly: peers.length === 0
    };
  }

  private get db() {
    if (!gunInstance) throw new Error("Gun not initialized. Call init() first.");
    return gunInstance.get(this.dbName);
  }

  // --- 데이터 노드 및 메서드 ---
  private get nodes() {
    return {
      users: this.db.get('users'),
      messages: this.db.get('messages'),
      events: this.db.get('events'),
      sharedGallery: this.db.get('shared-gallery')
    };
  }

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
