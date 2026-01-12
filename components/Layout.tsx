
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: '게임', icon: 'fa-gamepad' },
    { path: '/rank', label: '랭킹', icon: 'fa-trophy' },
    { path: '/profile', label: '내 정보', icon: 'fa-user' },
  ];

  if (user.isAdmin) {
    navItems.push({ path: '/admin', label: '관리자', icon: 'fa-cog' });
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      {/* 상단 헤더 */}
      <header className="h-16 bg-zinc-800/80 backdrop-blur-md border-b border-zinc-700 flex items-center justify-between px-5 sticky top-0 z-50">
        <h1 className="text-xl font-black text-yellow-400 tracking-tighter italic">🎰 럭키 스트라이크</h1>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[9px] text-zinc-400 uppercase font-bold">내 자산</p>
            <p className="text-sm font-black text-green-400">₩{user.balance.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full border-2 border-yellow-500 overflow-hidden bg-zinc-700"
          >
            <img 
              src={user.img || DEFAULT_PROFILE_IMG} 
              alt="프로필" 
              className="w-full h-full object-cover" 
            />
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 overflow-y-auto pb-24 pt-4 px-4 bg-gradient-to-b from-zinc-900 to-black">
        <Outlet />
      </main>

      {/* 하단 내비게이션 바 */}
      <nav className="h-20 bg-zinc-800/90 backdrop-blur-lg border-t border-zinc-700 fixed bottom-0 left-0 right-0 max-w-md mx-auto flex items-center justify-around px-2 z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                isActive ? 'text-yellow-400' : 'text-zinc-500'
              }`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-[11px] font-bold">{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-yellow-400"></div>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
