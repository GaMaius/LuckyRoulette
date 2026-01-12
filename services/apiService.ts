
import Gun from 'gun';
import { User, Message, SharedMedia } from '../types';

/**
 * 기본 공용 릴레이 피어 리스트
 */
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

    // 1. 전용 서버 주소 확인 (Vercel Environment Variables에서 설정한 값)
    // 브라우저 환경에서는 process.env 대신 글로벌 변수나 인젝션된 값을 참조할 수 있도록 함
    const envPeers = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GUN_PEERS) 
      ? process.env.NEXT_PUBLIC_GUN_PEERS.split(',') 
      : [];
    
    // 2. 전용 서버를 리스트의 맨 앞에 두어 우선순위 부여
    const finalPeers = [...new Set([...envPeers, ...PUBLIC_PEERS])];

    console.log('📡 Initializing Gun with Peers:', finalPeers);

    gunInstance = Gun({
      peers: finalPeers,
      localStorage: true,
      radisk: true,
      retry: 2000
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
