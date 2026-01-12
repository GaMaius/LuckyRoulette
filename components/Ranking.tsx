
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';

interface RankingProps {
  users: Record<string, User>;
}

const Ranking: React.FC<RankingProps> = ({ users }) => {
  const navigate = useNavigate();
  
  // 관리자(isAdmin: true 또는 id: 'admin') 제외 필터링 후 정렬
  const sortedUsers = (Object.values(users) as User[])
    .filter(u => !u.isAdmin && u.id !== 'admin')
    .sort((a, b) => b.balance - a.balance);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400 text-xl';
      case 1: return 'text-zinc-300 text-lg';
      case 2: return 'text-orange-500 text-md';
      default: return 'text-zinc-600 text-sm';
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className="text-center py-4">
        <h2 className="text-2xl font-black italic tracking-tighter text-yellow-400">명예의 전당</h2>
        <p className="text-xs text-zinc-500 font-bold uppercase mt-1">글로벌 자산가 순위</p>
      </div>

      <div className="flex flex-col gap-2">
        {sortedUsers.map((u, idx) => (
          <div
            key={u.id}
            className="group bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 flex items-center gap-4 transition-all"
          >
            <div className={`w-8 font-black text-center ${getRankStyle(idx)}`}>
              {idx === 0 ? <i className="fas fa-crown"></i> : idx + 1}
            </div>
            <div 
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-yellow-500 transition-colors cursor-pointer"
              onClick={() => navigate(`/profile/${u.id}`)}
            >
              <img src={u.img || DEFAULT_PROFILE_IMG} alt={u.id} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-black text-zinc-100 truncate cursor-pointer" onClick={() => navigate(`/profile/${u.id}`)}>{u.nick || u.id}</p>
              <p className="text-[10px] text-zinc-500 truncate">₩{u.balance.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate(`/chat/${u.id}`)}
                className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 hover:bg-yellow-500 hover:text-black transition-all"
                title="1:1 채팅"
              >
                <i className="fas fa-comment"></i>
              </button>
              <button 
                onClick={() => navigate(`/profile/${u.id}`)}
                className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 hover:bg-blue-500 hover:text-white transition-all"
                title="프로필 보기"
              >
                <i className="fas fa-user"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ranking;
