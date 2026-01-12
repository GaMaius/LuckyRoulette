
export interface User {
  id: string;
  pw: string;
  balance: number;
  nick: string;
  bio: string;
  img: string;
  isAdmin?: boolean;
}

export type ViewType = 'login' | 'signup' | 'game' | 'rank' | 'profile' | 'admin';

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
