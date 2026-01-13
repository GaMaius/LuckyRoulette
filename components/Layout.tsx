
import React, { useState, useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Message, DEFAULT_PROFILE_IMG } from '../types';
import { api } from '../services/apiService';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [peerCount, setPeerCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPC, setIsPC] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsPC(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    api.onConnectionChange(setPeerCount);
    api.subscribeMessages((newMsg) => {
      setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
    });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const unreadCount = useMemo(() => {
    const lastRead = user.lastRead || {};
    return messages.filter(m => {
      if (m.senderId === user.id) return false;
      const channelId = m.type === 'global' ? 'global' : m.senderId;
      if (m.type === 'direct' && m.targetId !== user.id) return false;
      return m.timestamp > (lastRead[channelId] || 0);
    }).length;
  }, [messages, user.lastRead, user.id]);

  const navItems = [
    { path: '/', label: '게임', icon: 'fa-gamepad' },
    { path: '/feed', label: '게시판', icon: 'fa-list-alt' },
    { path: '/rank', label: '랭킹', icon: 'fa-trophy' },
    { path: '/chat', label: '채팅', icon: 'fa-comments', badge: unreadCount },
    { path: '/profile', label: '프로필', icon: 'fa-user' },
  ];

  if (user.isAdmin) navItems.push({ path: '/admin', label: '관리', icon: 'fa-tools' });

  const Header = () => (
    <header className="h-16 bg-zinc-800/80 backdrop-blur-md border-b border-zinc-700 flex items-center justify-between px-5 sticky top-0 z-[100]">
      <div className="flex flex-col">
        <h1 className="text-lg font-black text-yellow-400 tracking-tighter italic leading-none">🎰 LUCKY STRIKE</h1>
        <div className="flex items-center gap-1 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${peerCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
          <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500">
            {peerCount > 0 ? `ONLINE ${peerCount}` : 'OFFLINE'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] text-zinc-400 uppercase font-bold">보유 자산</p>
          <p className="text-sm font-black text-green-400">₩{user.balance.toLocaleString()}</p>
        </div>
        <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full border border-yellow-500/50 overflow-hidden shadow-lg">
          <img src={user.img || DEFAULT_PROFILE_IMG} alt="" className="w-full h-full object-cover" />
        </button>
      </div>
    </header>
  );

  if (isPC) {
    return (
      <div className="flex h-screen w-full bg-zinc-950 overflow-hidden font-pretendard">
        {/* PC Sidebar */}
        <nav className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col p-4 z-[110]">
          <div className="mb-10 px-2 pt-4">
            <h1 className="text-2xl font-black text-yellow-400 italic tracking-tighter">LUCKY STRIKE</h1>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Premium Network</p>
          </div>
          <div className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} className={`flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${isActive ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>
                  <i className={`fas ${item.icon} text-lg`}></i>
                  <span className="font-black text-sm">{item.label}</span>
                  {(item.badge ?? 0) > 0 && (
                    <span className="ml-auto bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="mt-auto p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
            <div className="flex items-center gap-3 mb-3">
              <img src={user.img || DEFAULT_PROFILE_IMG} className="w-10 h-10 rounded-full object-cover border border-zinc-600" alt="" />
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate">{user.nick}</p>
                <p className="text-[10px] font-bold text-green-500">₩{user.balance.toLocaleString()}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full py-2 bg-zinc-700 hover:bg-red-900/20 hover:text-red-500 text-zinc-400 text-[10px] font-black rounded-lg transition-all">LOGOUT</button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-zinc-950">
            <div className="max-w-4xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden max-w-md mx-auto bg-zinc-950 border-x border-zinc-800">
      <Header />
      <main className="flex-1 overflow-y-auto pb-24 pt-4 px-4 custom-scrollbar">
        <Outlet />
      </main>
      <nav className="h-20 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800 fixed bottom-0 left-0 right-0 max-w-md mx-auto flex items-center justify-around px-2 z-[100]">
        {navItems.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative ${isActive ? 'text-yellow-400 scale-110' : 'text-zinc-500'}`}>
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-[10px] font-bold">{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <div className="absolute top-2 right-4 bg-red-600 text-[8px] text-white font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center border-2 border-zinc-900 shadow-lg">
                  {item.badge! > 99 ? '99+' : item.badge}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
