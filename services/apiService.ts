
import Gun from 'gun';
import { User, Message, SharedMedia } from '../types';

/**
 * 환경 변수를 안전하게 가져오는 함수
 */
const getEnv = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key] as string;
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key] as string;
    if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) return (window as any).process.env[key];
    return "";
  } catch (e) {
    return "";
  }
};

const PUBLIC_PEERS = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun',
  'https://gundb.com/gun'
];

let gunInstance: any = null;
let connectedPeers: Set<string> = new Set();
let statusCallback: ((count: number) => void) | null = null;

class ApiService {
  private dbName = 'lucky-strike-v105-mesh';

  async init(): Promise<void> {
    if (gunInstance) return;

    // 환경 변수에서 피어 목록 가져오기
    const rawPeers = getEnv("NEXT_PUBLIC_GUN_PEERS");
    const envPeers = rawPeers ? rawPeers.split(',').map(p => p.trim()) : [];
    
    // 피어 주소 정제 (https -> wss 자동 변환)
    const processPeerUrl = (url: string) => {
      if (!url) return "";
      // Gun.js는 브라우저에서 보통 wss를 선호함
      return url.replace('http://', 'ws://').replace('https://', 'wss://');
    };

    const finalPeers = [...new Set([...envPeers.map(processPeerUrl), ...PUBLIC_PEERS.map(processPeerUrl)])].filter(Boolean);

    console.log('📡 Gun Mesh Connecting to:', finalPeers);

    gunInstance = Gun({
      peers: finalPeers,
      localStorage: true,
      radisk: true,
      retry: 3000
    });

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
    
    // 5초 후에도 연결된 피어가 없으면 경고 출력
    setTimeout(() => {
      if (connectedPeers.size === 0) {
        console.warn("⚠️ 실시간 서버 연결에 실패했습니다. 로컬 캐시 모드로 작동합니다.");
        this.notifyStatus();
      }
    }, 5000);
  }

  private notifyStatus() {
    if (statusCallback) {
      statusCallback(connectedPeers.size);
    }
  }

  onConnectionChange(callback: (count: number) => void) {
    statusCallback = callback;
    if (gunInstance) callback(connectedPeers.size);
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
