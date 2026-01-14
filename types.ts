
export interface Comment {
  id: string;
  uploaderId: string;
  uploaderNick: string;
  text: string;
  timestamp: number;
  replies?: Comment[]; // 대댓글을 위한 필드
}

export interface Post {
  id: string;
  title: string;
  content: string;
  uploaderId: string;
  uploaderNick: string;
  img?: string;
  timestamp: number;
  isNotice?: boolean;
  comments?: Comment[];
}

export interface SharedMedia {
  id: string;
  uploaderId: string;
  uploaderNick: string;
  data: string;
  timestamp: number;
  type: 'image' | 'video';
}

// @google/genai Coding Guidelines 준수를 위해 채팅 메시지 타입을 정의합니다.
export interface Message {
  id: string;
  senderId: string;
  senderNick: string;
  senderImg: string;
  text: string;
  timestamp: number;
  type: 'global' | 'direct';
  targetId?: string;
  isDeleted?: boolean;
  replyTo?: {
    id: string;
    senderNick: string;
    text: string;
  };
}

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
  lastRead?: Record<string, number>; 
  sessionLogs?: string[]; // 상세 접속 로그 이력
}

export const DEFAULT_PROFILE_IMG = "https://picsum.photos/seed/user/200/200";
export const SLOT_SYMBOLS = ['🍒', '🍋', '🍉', '🍇', '💎', '7️⃣'];
