
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';

interface AdminProps {
  users: Record<string, User>;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const Admin: React.FC<AdminProps> = ({ users, onDeleteUser }) => {
  const navigate = useNavigate();
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<User | null>(null);
  
  const userList = (Object.values(users) as User[]).sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0));

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '접속 기록 없음';
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-24 relative">
      <div className="text-center py-6">
        <h2 className="text-3xl font-black italic tracking-tighter text-red-600 uppercase">System Integrity Console</h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2 text-center tracking-[0.3em]">Real-time Cryptographic Audit & User Monitoring</p>
      </div>

      {/* 대시보드 통계 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-users text-6xl"></i>
          </div>
          <p className="text-[10px] text-zinc-500 font-black uppercase mb-2">Total Entities</p>
          <p className="text-3xl font-black text-white">{userList.length}<span className="text-xs font-bold text-zinc-600 ml-1">UNITS</span></p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-microchip text-6xl"></i>
          </div>
          <p className="text-[10px] text-zinc-500 font-black uppercase mb-2">Total Liquidity</p>
          <p className="text-3xl font-black text-green-500">
            {userList.reduce((acc, cur) => acc + (cur.balance || 0), 0).toLocaleString()}<span className="text-[10px] ml-1 font-bold">₩</span>
          </p>
        </div>
      </div>

      {/* 유저 리스트 */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-database text-red-500"></i> Node Records
          </h3>
          <span className="text-[9px] font-bold text-red-500 animate-pulse flex items-center gap-1">
            <div className="w-1 h-1 bg-red-500 rounded-full"></div> ENCRYPTED LIVE FEED
          </span>
        </div>
        
        <div className="flex flex-col gap-4">
          {userList.map((u) => (
            <div
              key={u.id}
              className="bg-zinc-900/80 border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col gap-6 shadow-xl transition-all hover:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={u.img || DEFAULT_PROFILE_IMG} 
                      alt={u.id} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-zinc-800 shadow-lg"
                    />
                    {u.isAdmin && (
                      <div className="absolute -bottom-1 -right-1 bg-red-600 text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-zinc-950 shadow-lg">ROOT</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white text-lg tracking-tight truncate max-w-[120px]">
                        {u.nick || u.id}
                      </p>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black border uppercase ${
                        u.environment === 'PC' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {u.environment || '???'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">UID: {u.id}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedUserForLogs(u)}
                    className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-90"
                    title="세션 로그 보기"
                  >
                    <i className="fas fa-history text-xs"></i>
                  </button>
                  <button 
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-yellow-500 hover:text-black transition-all shadow-lg active:scale-90"
                    title="편집"
                  >
                    <i className="fas fa-user-edit text-xs"></i>
                  </button>
                </div>
              </div>

              {/* 요약 대시보드 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800">
                  <p className="text-[8px] text-zinc-600 font-black uppercase mb-1">Last Connection</p>
                  <p className="text-[11px] font-black text-zinc-300 truncate">{formatDate(u.lastLogin)}</p>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800">
                  <p className="text-[8px] text-zinc-600 font-black uppercase mb-1">Asset Status</p>
                  <p className="text-[11px] font-black text-green-500">₩{(u.balance || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* 하단 제어 및 삭제 */}
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-zinc-800/50">
                <div className="flex flex-col">
                  <span className="text-[8px] text-zinc-600 font-black uppercase">Identifier (PW)</span>
                  <span className="text-[10px] font-mono text-yellow-500/70 select-text">{u.pw}</span>
                </div>
                {!u.isAdmin && (
                  <button 
                    onClick={() => { if (window.confirm(`[${u.id}] 계정을 보안 파쇄 하시겠습니까?`)) onDeleteUser(u.id); }}
                    className="px-4 py-2 bg-red-900/10 text-red-500 text-[10px] font-black rounded-xl border border-red-900/20 hover:bg-red-600 hover:text-white transition-all"
                  >
                    SHRED ENTITY
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 세션 로그 모달 */}
      {selectedUserForLogs && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 flex flex-col gap-6 shadow-2xl max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-6 flex-shrink-0">
              <div className="flex items-center gap-4">
                <img src={selectedUserForLogs.img} className="w-12 h-12 rounded-full border-2 border-red-600" alt="" />
                <div>
                  <h2 className="text-xl font-black text-white italic uppercase">{selectedUserForLogs.nick}</h2>
                  <p className="text-[9px] text-red-500 font-black tracking-widest uppercase">Entity Session History</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForLogs(null)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar py-2">
              {selectedUserForLogs.sessionLogs && selectedUserForLogs.sessionLogs.length > 0 ? (
                selectedUserForLogs.sessionLogs.map((log, i) => (
                  <div key={i} className="bg-black/50 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 animate-slideUp" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="w-2 h-2 rounded-full bg-red-600/50 shadow-[0_0_10px_rgba(220,38,38,0.5)] flex-shrink-0"></div>
                    <p className="text-xs font-mono text-zinc-400 leading-relaxed select-text">{log}</p>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-zinc-600 italic">
                  <i className="fas fa-ghost text-4xl mb-4 opacity-10"></i>
                  <p className="text-sm font-black uppercase tracking-widest">No active session history found</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedUserForLogs(null)} 
              className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex-shrink-0 uppercase tracking-widest italic"
            >
              Close Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
