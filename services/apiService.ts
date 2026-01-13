
import Gun from 'gun';
import { User, Message, SharedMedia } from '../types';

/**
 * 환경 변수 및 현재 접속 주소에서 피어를 자동으로 찾습니다.
 */
const getAutoPeers = (): string[] => {
  const peers: string[] = [];
  
  if (typeof window !== 'undefined') {
    // Koyeb에서 생성된 현재 도메인의 /gun 경로를 자동으로 연결합니다.
    const currentHost = window.location.origin + '/gun';
    peers.push(currentHost);
  }

  // 백업용 공용 피어
  peers.push('https://gun-manhattan.herokuapp.com/gun');

  return [...new Set(peers)];
};

let gunInstance: any = null;
let connectedPeers: Set<string> = new Set();
let statusCallback: ((count: number) => void) | null = null;

class ApiService {
  private dbName = 'lucky-strike-v105-mesh';

  async init(): Promise<void> {
    if (gunInstance) return;

    const finalPeers = getAutoPeers();
    console.log('📡 [Gun] Connecting to Peers:', finalPeers);

    gunInstance = Gun({
      peers: finalPeers,
      localStorage: true,
      radisk: true,
      retry: 5000
    });

    gunInstance.on('hi', (peer: any) => {
      connectedPeers.add(peer.url);
      this.notifyStatus();
    });

    gunInstance.on('bye', (peer: any) => {
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
