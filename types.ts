
export interface User {
  id: string;
  pw: string;
  balance: number;
  nick: string;
  bio: string;
  img: string;
  gallery?: string[]; // 사용자가 업로드한 사진들 (Base64 배열)
  isAdmin?: boolean;
  lastLogin?: number; // 마지막 접속 시간 (타임스탬프)
  environment?: 'PC' | 'Mobile'; // 접속 환경 정보
}

export interface Message {
  id: string;
  senderId: string;
  senderNick: string;
  senderImg: string;
  text: string;
  timestamp: number;
  type: 'global' | 'direct';
  targetId?: string; // 1:1 채팅일 경우 수신자 ID
}

export type ViewType = 'login' | 'signup' | 'game' | 'rank' | 'chat' | 'profile' | 'admin';

export interface GameHistory {
  userId: string;
  bet: number;
  profit: number;
  result: string[];
  message: string;
  timestamp: number;
}

export const DEFAULT_PROFILE_IMG = "https://picsum.photos/seed/user/200/200";

export const SLOT_SYMBOLS = ['🍒', '🍋', '🍉', '🍇', '💎', '7️⃣'];
