
import Gun from 'gun';
import { User, Message, SharedMedia } from '../types';

const getAutoPeers = (): string[] => {
  const peers: string[] = [];
  if (typeof window !== 'undefined') {
    const currentHost = window.location.origin + '/gun';
    peers.push(currentHost);
  }
  peers.push('https://gun-manhattan.herokuapp.com/gun');
  return [...new Set(peers)];
};

let gunInstance: any = null;
let connectedPeers: Set<string> = new Set();
let statusCallback: ((count: number) => void) | null = null;

class ApiService {
  private dbName = 'lucky-strike-v108-mesh';

  async init(): Promise<void> {
    if (gunInstance) return;
    const finalPeers = getAutoPeers();
    gunInstance = Gun({
      peers: finalPeers,
      localStorage: true,
      radisk: true,
      retry: 3000
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
    if (statusCallback) statusCallback(connectedPeers.size);
  }

  onConnectionChange(callback: (count: number) => void) {
    statusCallback = callback;
    if (gunInstance) callback(connectedPeers.size);
  }

  private get nodes() {
    const root = gunInstance.get(this.dbName);
    return {
      users: root.get('users'),
      messages: root.get('messages'),
      events: root.get('events'),
      sharedGallery: root.get('shared-gallery')
    };
  }

  private sanitize(obj: any) {
    const sanitized = { ...obj };
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        sanitized[key] = null;
      }
    });
    return sanitized;
  }

  subscribeUsers(callback: (users: Record<string, User>) => void) {
    this.nodes.users.map().on((data: any, id: string) => {
      if (data && typeof data === 'object') {
        const { _, ...user } = data;
        if (user && user.id) {
          if (typeof user.gallery === 'string') {
            try { user.gallery = JSON.parse(user.gallery); } catch (e) { user.gallery = []; }
          }
          if (typeof user.lastRead === 'string') {
            try { user.lastRead = JSON.parse(user.lastRead); } catch (e) { user.lastRead = {}; }
          }
          callback({ [id]: user as User });
        }
      }
    });
  }

  async saveUser(user: User): Promise<void> {
    const dataToSave = this.sanitize({
      ...user,
      gallery: Array.isArray(user.gallery) ? JSON.stringify(user.gallery) : (user.gallery || "[]"),
      lastRead: user.lastRead ? JSON.stringify(user.lastRead) : "{}"
    });
    
    return new Promise((resolve, reject) => {
      this.nodes.users.get(user.id).put(dataToSave, (ack: any) => {
        if (ack.err) {
          console.error('Gun Save Error:', ack.err);
          reject(ack.err);
        } else {
          resolve();
        }
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
    this.nodes.sharedGallery.get(media.id).put(this.sanitize(media));
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
    return new Promise((resolve) => {
      this.nodes.messages.get(msg.id).put(this.sanitize(msg), (ack: any) => {
        resolve();
      });
    });
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
