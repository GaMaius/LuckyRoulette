
import { User, Message } from '../types';

/**
 * [중요] 실제 서버로 공유하려면 이 클래스의 각 메서드를 
 * Firebase, Supabase 또는 본인의 API 서버 fetch 호출로 교체하면 됩니다.
 * 현재는 중앙 집중식 Mock Server 역할을 수행합니다.
 */
class ApiService {
  private DB_KEY = 'lucky_strike_shared_db_v2';
  private CHAT_KEY = 'lucky_strike_shared_chat_v2';
  private EVENTS_KEY = 'lucky_strike_shared_events_v2';

  private async simulateNetwork() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }

  // --- 사용자 관련 ---
  async getUsers(): Promise<Record<string, User>> {
    await this.simulateNetwork();
    const data = localStorage.getItem(this.DB_KEY);
    return data ? JSON.parse(data) : {};
  }

  async saveUser(user: User): Promise<void> {
    await this.simulateNetwork();
    const users = await this.getUsers();
    users[user.id] = user;
    localStorage.setItem(this.DB_KEY, JSON.stringify(users));
  }

  async deleteUser(userId: string): Promise<void> {
    const users = await this.getUsers();
    delete users[userId];
    localStorage.setItem(this.DB_KEY, JSON.stringify(users));
  }

  // --- 채팅 관련 ---
  async getMessages(): Promise<Message[]> {
    await this.simulateNetwork();
    const data = localStorage.getItem(this.CHAT_KEY);
    return data ? JSON.parse(data) : [];
  }

  async sendMessage(msg: Message): Promise<void> {
    const messages = await this.getMessages();
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    localStorage.setItem(this.CHAT_KEY, JSON.stringify(messages));
  }

  // --- 실시간 이벤트 로그 관련 (리얼 이벤트 공유) ---
  async logEvent(message: string): Promise<void> {
    const data = localStorage.getItem(this.EVENTS_KEY);
    const events: string[] = data ? JSON.parse(data) : [];
    events.push(message);
    if (events.length > 20) events.shift(); // 최근 20개 유지
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
  }

  async getLatestEvents(): Promise<string[]> {
    const data = localStorage.getItem(this.EVENTS_KEY);
    return data ? JSON.parse(data) : ["서버에 연결되었습니다. 행운을 빕니다!"];
  }
}

export const api = new ApiService();

// 기존 가상 생성기 대신 실제 로그에서 가져오는 방식으로 변경을 유도하기 위한 헬퍼
export const getLiveActivity = async () => {
  const events = await api.getLatestEvents();
  return events[events.length - 1];
};
