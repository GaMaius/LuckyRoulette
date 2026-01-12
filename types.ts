
export interface User {
  id: string;
  pw: string;
  balance: number;
  nick: string;
  bio: string;
  img: string;
  gallery?: string[];
  isAdmin?: boolean;
  lastLogin?: number;
  environment?: 'PC' | 'Mobile';
}

export interface SharedMedia {
  id: string;
  uploaderId: string;
  uploaderNick: string;
  data: string; // Base64 이미지 데이터
  timestamp: number;
  type: 'image' | 'video';
}

export interface Message {
  id: string;
  senderId: string;
  senderNick: string;
  senderImg: string;
  text: string;
  timestamp: number;
  type: 'global' | 'direct';
  targetId?: string;
}

export type ViewType = 'login' | 'signup' | 'game' | 'rank' | 'chat' | 'profile' | 'admin' | 'shared-gallery';

export const DEFAULT_PROFILE_IMG = "https://picsum.photos/seed/user/200/200";
export const SLOT_SYMBOLS = ['🍒', '🍋', '🍉', '🍇', '💎', '7️⃣'];
