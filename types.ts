
export interface Comment {
  id: string;
  uploaderId: string;
  uploaderNick: string;
  text: string;
  timestamp: number;
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

// Added SharedMedia interface for the global shared gallery/feed feature
export interface SharedMedia {
  id: string;
  uploaderId: string;
  uploaderNick: string;
  data: string;
  timestamp: number;
  type: 'image' | 'video';
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
  isDeleted?: boolean;
  replyTo?: {
    id: string;
    senderNick: string;
    text: string;
  };
}

export const DEFAULT_PROFILE_IMG = "https://picsum.photos/seed/user/200/200";
export const SLOT_SYMBOLS = ['🍒', '🍋', '🍉', '🍇', '💎', '7️⃣'];
