
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';

interface AdminProps {
  users: Record<string, User>;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const Admin: React.FC<AdminProps> = ({ users, onDeleteUser }) => {
  const navigate = useNavigate();
  const userList = (Object.values(users) as User[]).sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0));

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '기록 없음';
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-10">
      <div className="text-center py-4">
        <h2 className="text-2xl font-black italic tracking-tighter text-red-500">관리 시스템 컨솔</h2>
        <p className="text-xs text-zinc-500 font-bold uppercase mt-1 text-center tracking-widest">실시간 접속 로그 및 유저 무결성 검사</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800/40 p-4 rounded-3xl border border-zinc-800/50 shadow-inner">
          <p className="text-[10px] text-zinc-500 font-black uppercase mb-1 flex items-center gap-1">
            <i className="fas fa-users text-[8px]"></i> 활성 엔티티
          </p>
          <p className="text-xl font-black text-white">{userList.length}<span className="text-xs font-bold text-zinc-500 ml-1">UNITS</span></p>
        </div>
        <div className="bg-zinc-800/40 p-4 rounded-3xl border border-zinc-800/50 shadow-inner">
          <p className="text-[10px] text-zinc-500 font-black uppercase mb-1 flex items-center gap-1">
            <i className="fas fa-coins text-[8px]"></i> 총 유동 자산
          </p>
          <p className="text-xl font-black text-green-400">
            {userList.reduce((acc, cur) => acc + cur.balance, 0).toLocaleString()}<span className="text-[10px] ml-1 font-bold">₩</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-stream"></i> 시스템 이벤트 로그
          </h3>
          <span className="text-[10px] font-bold text-red-500/50 animate-pulse">LIVE MONITORING</span>
        </div>
        
        <div className="flex flex-col gap-4">
          {userList.map((u) => (
            <div
              key={u.id}
              className="bg-zinc-800/60 border border-zinc-700/30 rounded-[2.5rem] p-6 flex flex-col gap-5 shadow-2xl backdrop-blur-sm transition-all hover:bg-zinc-800/80"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={u.img || DEFAULT_PROFILE_IMG} 
                      alt={u.id} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700/50 shadow-2xl p-0.5"
                    />
                    {u.isAdmin && (
                      <div className="absolute -bottom-1 -right-1 bg-red-600 text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-zinc-900 shadow-lg">ROOT</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white text-lg tracking-tight">
                        {u.nick || u.id}
                      </p>
                      {u.environment && (
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black border flex items-center gap-1 ${
                          u.environment === 'PC' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          <i className={`fas ${u.environment === 'PC' ? 'fa-laptop' : 'fa-mobile-alt'} text-[7px]`}></i>
                          {u.environment}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">UID: {u.id}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="w-10 h-10 rounded-2xl bg-zinc-700/50 flex items-center justify-center text-zinc-400 hover:bg-yellow-500 hover:text-black transition-all shadow-lg active:scale-90 border border-zinc-600/30"
                  >
                    <i className="fas fa-user-edit text-xs"></i>
                  </button>
                  {!u.isAdmin && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`[${u.id}] 계정을 보안 파쇄 하시겠습니까?`)) {
                          onDeleteUser(u.id);
                        }
                      }}
                      className="w-10 h-10 rounded-2xl bg-red-900/10 text-red-500/50 flex items-center justify-center text-xs hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-90 border border-red-500/10"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* 로그 상세 데이터 */}
              <div className="bg-black/40 rounded-3xl p-4 border border-zinc-800/50 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">최근 접속 세션</p>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 font-mono tracking-tighter">
                    {formatDate(u.lastLogin)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">환경 로그</p>
                    <div className="flex items-center gap-1.5">
                      <i className={`fas ${u.environment === 'PC' ? 'fa-desktop' : 'fa-mobile'} text-zinc-400 text-[10px]`}></i>
                      <p className="text-xs font-black text-zinc-300 italic">{u.environment || 'UNKNOWN'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">자산 스테이터스</p>
                    <div className="flex items-center gap-1.5">
                      <i className="fas fa-wallet text-green-500/50 text-[10px]"></i>
                      <p className="text-xs font-black text-green-400 italic">₩{u.balance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* 보안 데이터 노출 (비밀번호) */}
                <div className="flex justify-between items-center border-t border-zinc-800 pt-2">
                  <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">보안 식별자 (PW)</p>
                  <p className="text-xs font-bold text-yellow-500/80 font-mono select-text">{u.pw}</p>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">미디어 라이브러리</p>
                  <p className="text-[10px] font-black text-yellow-500/70 italic">{(u.gallery?.length || 0)} FILES SYNCED</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
