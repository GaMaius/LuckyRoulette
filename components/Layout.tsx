
import React, { useState, useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Message, DEFAULT_PROFILE_IMG } from '../types';
import { api } from '../services/apiService';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [peerCount, setPeerCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    api.onConnectionChange((count) => {
      setPeerCount(count);
    });
    // 실시간 메시지 구독 (배지 계산용)
    api.subscribeMessages((newMsg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });
  }, []);

  // 안읽은 메시지 총 개수 계산
  const unreadCount = useMemo(() => {
    const lastRead = user.lastRead || {};
    return messages.filter(m => {
      if (m.senderId === user.id) return false;
      
      const channelId = m.type === 'global' ? 'global' : m.senderId;
      const lastReadTime = lastRead[channelId] || 0;
      
      // 1:1 메시지인 경우 나에게 온 것만 계산
      if (m.type === 'direct' && m.targetId !== user.id) return false;
      
      return m.timestamp > lastReadTime;
    }).length;
  }, [messages, user.lastRead, user.id]);

  const navItems = [
    { path: '/', label: '게임', icon: 'fa-gamepad' },
    { path: '/feed', label: '피드', icon: 'fa-rss' },
    { path: '/rank', label: '랭킹', icon: 'fa-trophy' },
    { path: '/chat', label: '채팅', icon: 'fa-comments', badge: unreadCount },
    { path: '/profile', label: '프로필', icon: 'fa-user' },
  ];

  if (user.isAdmin) {
    navItems.push({ path: '/admin', label: '관리', icon: 'fa-tools' });
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      <header className="h-16 bg-zinc-800/80 backdrop-blur-md border-b border-zinc-700 flex items-center justify-between px-5 sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-lg font-black text-yellow-400 tracking-tighter italic leading-none">🎰 LUCKY STRIKE</h1>
          <div className="flex items-center gap-1 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${peerCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
            <span className={`text-[7px] font-black uppercase tracking-widest ${peerCount > 0 ? 'text-green-500' : 'text-orange-500'}`}>
              {peerCount > 0 ? `실시간 보안망 (${peerCount}명)` : '오프라인 모드'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[9px] text-zinc-400 uppercase font-bold">보유 자산</p>
            <p className="text-sm font-black text-green-400">₩{user.balance.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full border-2 border-yellow-500 overflow-hidden bg-zinc-700 shadow-lg"
          >
            <img src={user.img || DEFAULT_PROFILE_IMG} alt="P" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 pt-4 px-4 bg-gradient-to-b from-zinc-900 to-black custom-scrollbar">
        <Outlet />
      </main>

      <nav className="h-20 bg-zinc-800/90 backdrop-blur-lg border-t border-zinc-700 fixed bottom-0 left-0 right-0 max-w-md mx-auto flex items-center justify-around px-2 z-50">
        {navItems.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          const hasBadge = (item.badge ?? 0) > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative ${
                isActive ? 'text-yellow-400 scale-110' : 'text-zinc-500'
              }`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-[10px] font-bold">{item.label}</span>
              
              {/* badge가 0보다 클 때만 명시적으로 렌더링 */}
              {hasBadge && (
                <div className="absolute top-2 right-4 bg-red-600 text-[8px] text-white font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center border-2 border-zinc-800 shadow-lg animate-bounce-subtle">
                  {item.badge! > 99 ? '99+' : item.badge}
                </div>
              )}
              
              {isActive && <div className="w-1 h-1 rounded-full bg-yellow-400"></div>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
