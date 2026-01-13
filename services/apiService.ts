
import Gun from 'gun';
import { User, Message, Post, Comment, SharedMedia } from '../types';

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
  private dbName = 'lucky-strike-v109-final'; // 피드 초기화를 위해 노드 이름 변경

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
      board: root.get('board-v2'),
      sharedGallery: root.get('shared-gallery')
    };
  }

  private sanitize(obj: any) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = { ...obj };
    delete (sanitized as any)._;
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) sanitized[key] = null;
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
      } else if (data === null) {
        // 유저 삭제 대응 (로컬 상태 반영은 App.tsx에서 처리)
      }
    });
  }

  async saveUser(user: User): Promise<void> {
    const dataToSave = this.sanitize({
      ...user,
      gallery: Array.isArray(user.gallery) ? JSON.stringify(user.gallery) : (user.gallery || "[]"),
      lastRead: (user.lastRead && typeof user.lastRead === 'object') ? JSON.stringify(user.lastRead) : (user.lastRead || "{}")
    });
    return new Promise((resolve, reject) => {
      this.nodes.users.get(user.id).put(dataToSave, (ack: any) => {
        if (ack.err) reject(new Error(ack.err));
        else resolve();
      });
    });
  }

  subscribeBoard(callback: (post: Post) => void) {
    this.nodes.board.map().on((data: any) => {
      if (data && data.id) {
        const { _, ...post } = data;
        if (typeof post.comments === 'string') {
          try { post.comments = JSON.parse(post.comments); } catch (e) { post.comments = []; }
        }
        callback(post as Post);
      }
    });
  }

  async savePost(post: Post): Promise<void> {
    const data = this.sanitize({
      ...post,
      comments: JSON.stringify(post.comments || [])
    });
    return new Promise((resolve, reject) => {
      this.nodes.board.get(post.id).put(data, (ack: any) => {
        if (ack.err) reject(ack.err);
        else resolve();
      });
    });
  }

  async deletePost(postId: string): Promise<void> {
    return new Promise((resolve) => {
      this.nodes.board.get(postId).put(null as any, () => resolve());
    });
  }

  subscribeMessages(callback: (msg: Message) => void) {
    this.nodes.messages.map().on((data: any) => {
      if (data && data.id) {
        const { _, ...msg } = data;
        if (typeof msg.replyTo === 'string') {
          try { msg.replyTo = JSON.parse(msg.replyTo); } catch (e) { msg.replyTo = undefined; }
        }
        callback(msg as Message);
      }
    });
  }

  async sendMessage(msg: Message): Promise<void> {
    const data = this.sanitize({
      ...msg,
      replyTo: msg.replyTo ? JSON.stringify(msg.replyTo) : null
    });
    return new Promise((resolve, reject) => {
      this.nodes.messages.get(msg.id).put(data, (ack: any) => {
        if (ack.err) reject(new Error(ack.err));
        else resolve();
      });
    });
  }

  async deleteMessage(msgId: string): Promise<void> {
    this.nodes.messages.get(msgId).get('isDeleted').put(true);
    this.nodes.messages.get(msgId).get('text').put('삭제된 메시지입니다.');
  }

  // Subscribe to real-time events for the live activity feed
  subscribeEvents(callback: (event: string) => void) {
    this.nodes.events.map().on((data: any) => {
      if (data && typeof data === 'string') {
        callback(data);
      }
    });
  }

  async logEvent(message: string): Promise<void> {
    this.nodes.events.set(message);
  }

  // Subscribe to the shared gallery for global media sharing
  subscribeSharedGallery(callback: (item: SharedMedia) => void) {
    this.nodes.sharedGallery.map().on((data: any) => {
      if (data && data.id) {
        const { _, ...item } = data;
        callback(item as SharedMedia);
      }
    });
  }

  // Upload a new media item to the shared gallery
  async uploadToSharedGallery(media: SharedMedia): Promise<void> {
    const data = this.sanitize(media);
    return new Promise((resolve, reject) => {
      this.nodes.sharedGallery.get(media.id).put(data, (ack: any) => {
        if (ack.err) reject(new Error(ack.err));
        else resolve();
      });
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return new Promise((resolve) => {
      this.nodes.users.get(userId).put(null as any, () => {
        // 계정 연관 데이터들 정리 (선택 사항)
        resolve();
      });
    });
  }
}

export const api = new ApiService();
