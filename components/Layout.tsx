
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
    { path: '/', label: 'PLAY', icon: 'fa-gamepad' },
    { path: '/feed', label: 'FEED', icon: 'fa-layer-group' },
    { path: '/rank', label: 'RANK', icon: 'fa-crown' },
    { path: '/chat', label: 'CHAT', icon: 'fa-comment-alt', badge: unreadCount },
    { path: '/profile', label: 'USER', icon: 'fa-user-circle' },
  ];

  if (user.isAdmin) navItems.push({ path: '/admin', label: 'ROOT', icon: 'fa-terminal' });

  const Header = () => (
    <header className="h-16 glass sticky top-0 z-[100] flex items-center justify-between px-6 border-b border-white/5 shadow-2xl">
      <div className="flex flex-col">
        <h1 className="text-xl font-black text-amber-400 tracking-tighter italic leading-none drop-shadow-md">LUCKY STRIKE</h1>
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${peerCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            {peerCount > 0 ? `LINKED NODES: ${peerCount}` : 'DISCONNECTED'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Available Credit</p>
          <p className="text-sm font-black text-emerald-400">₩{user.balance.toLocaleString()}</p>
        </div>
        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-2xl border border-amber-500/30 overflow-hidden shadow-xl hover:scale-105 active:scale-95 transition-all">
          <img src={user.img || DEFAULT_PROFILE_IMG} alt="" className="w-full h-full object-cover" />
        </button>
      </div>
    </header>
  );

  if (isPC) {
    return (
      <div className="flex h-screen w-full bg-[#09090b] overflow-hidden font-pretendard">
        {/* PC Sidebar */}
        <nav className="w-72 bg-zinc-900/40 border-r border-white/5 flex flex-col p-6 z-[110] glass">
          <div className="mb-12 px-2">
            <h1 className="text-3xl font-black text-amber-500 italic tracking-tighter">LUCKY STRIKE</h1>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em] mt-2">Elite Social Casino</p>
          </div>
          <div className="flex-1 space-y-3">
            {navItems.map((item) => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} className={`flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${isActive ? 'bg-amber-500 text-black shadow-[0_10px_30px_rgba(245,158,11,0.2)]' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}`}>
                  <i className={`fas ${item.icon} text-xl w-6 text-center`}></i>
                  <span className="font-black text-sm tracking-tighter">{item.label}</span>
                  {(item.badge ?? 0) > 0 && (
                    <span className="ml-auto bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 mb-4">
              <img src={user.img || DEFAULT_PROFILE_IMG} className="w-11 h-11 rounded-2xl object-cover border border-amber-500/20 shadow-md" alt="" />
              <div className="overflow-hidden">
                <p className="text-sm font-black text-white truncate">{user.nick}</p>
                <p className="text-[11px] font-black text-emerald-400">₩{user.balance.toLocaleString()}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full py-3.5 bg-zinc-800/50 hover:bg-rose-900/20 hover:text-rose-500 text-zinc-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest border border-white/5">Terminate Session</button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#09090b]">
            <div className="max-w-4xl mx-auto animate-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden max-w-md mx-auto bg-[#09090b]">
      <Header />
      <main className="flex-1 overflow-y-auto pb-32 pt-6 px-5 custom-scrollbar animate-up">
        <Outlet />
      </main>
      
      {/* Mobile Floating Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-[100]">
        <nav className="h-20 glass rounded-[2.5rem] border border-white/10 flex items-center justify-around px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {navItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all relative ${isActive ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-400'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-amber-500/10 scale-110 shadow-[0_0_20px_rgba(251,191,36,0.1)]' : ''}`}>
                  <i className={`fas ${item.icon} text-xl`}></i>
                </div>
                <span className={`text-[8px] font-black tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <div className="absolute top-1.5 right-2 bg-rose-600 text-[8px] text-white font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-zinc-900 shadow-xl">
                    {item.badge! > 99 ? '99+' : item.badge}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
