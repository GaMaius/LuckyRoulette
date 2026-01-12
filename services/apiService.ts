
import Gun from 'gun';
import { User, Message, SharedMedia } from '../types';

/**
 * 환경 변수에서 피어 목록을 가져옵니다.
 */
const getGunPeers = (): string => {
  // @ts-ignore
  const peers = process.env.NEXT_PUBLIC_GUN_PEERS || process.env.GUN_PEERS || (window as any).process?.env?.NEXT_PUBLIC_GUN_PEERS;
  return peers || "";
};

const PUBLIC_PEERS = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gundb.com/gun'
];

let gunInstance: any = null;
let connectedPeers: Set<string> = new Set();
let statusCallback: ((count: number) => void) | null = null;

class ApiService {
  private dbName = 'lucky-strike-v105-mesh';

  async init(): Promise<void> {
    if (gunInstance) return;

    const rawPeersEnv = getGunPeers();
    const envPeers = rawPeersEnv ? rawPeersEnv.split(',').map(p => p.trim()) : [];
    
    const processPeerUrl = (url: string) => {
      if (!url) return "";
      let target = url;
      // Render 서버 주소 보정
      if (!target.includes('/gun')) {
        target = target.endsWith('/') ? target + 'gun' : target + '/gun';
      }
      return target;
    };

    const finalPeers = [...new Set([...envPeers.map(processPeerUrl), ...PUBLIC_PEERS.map(processPeerUrl)])].filter(Boolean);

    console.log('📡 [Gun] Connecting to Peers:', finalPeers);

    gunInstance = Gun({
      peers: finalPeers,
      localStorage: true,
      radisk: true,
      retry: 7000 // Render 서버가 깨어날 시간을 충분히 줌
    });

    gunInstance.on('hi', (peer: any) => {
      console.log('✅ [Gun] Peer Active:', peer.url);
      connectedPeers.add(peer.url);
      this.notifyStatus();
    });

    gunInstance.on('bye', (peer: any) => {
      console.log('❌ [Gun] Peer Lost:', peer.url);
      connectedPeers.delete(peer.url);
      this.notifyStatus();
    });
    
    setTimeout(() => {
      if (connectedPeers.size === 0) {
        console.warn("⚠️ [Gun] 전용 서버(Render) 연결 지연 중. 첫 접속 시 깨어나는 데 30초가 걸릴 수 있습니다.");
        this.notifyStatus();
      }
    }, 12000);
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
