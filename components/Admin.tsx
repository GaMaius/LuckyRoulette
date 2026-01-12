
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
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="text-center py-4">
        <h2 className="text-2xl font-black italic tracking-tighter text-red-500">관리자 대시보드</h2>
        <p className="text-xs text-zinc-500 font-bold uppercase mt-1">회원 정보 및 보안 로그 관리</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
          <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">전체 회원</p>
          <p className="text-xl font-black text-white">{userList.length}명</p>
        </div>
        <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
          <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">총 발행 자산</p>
          <p className="text-xl font-black text-green-400">
            {userList.reduce((acc, cur) => acc + cur.balance, 0).toLocaleString()}원
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-black text-zinc-400 px-1 flex items-center gap-2">
          <i className="fas fa-list-ul"></i> 회원 상세 목록 (최근 접속순)
        </h3>
        
        <div className="flex flex-col gap-3">
          {userList.map((u) => (
            <div
              key={u.id}
              className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-4 flex flex-col gap-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={u.img || DEFAULT_PROFILE_IMG} 
                      alt={u.id} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
                    />
                    {u.isAdmin && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-black">관리자</span>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-white text-base">
                      {u.nick || '닉네임 없음'} <span className="text-zinc-500 text-xs font-normal">(@{u.id})</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <i className="fas fa-clock"></i> 마지막 접속: {formatDate(u.lastLogin)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center text-sm hover:bg-zinc-600 transition-colors"
                    title="상세 수정"
                  >
                    <i className="fas fa-user-edit"></i>
                  </button>
                  {!u.isAdmin && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`${u.id} 유저를 영구 삭제하시겠습니까?`)) {
                          onDeleteUser(u.id);
                        }
                      }}
                      className="w-10 h-10 rounded-xl bg-red-900/30 text-red-500 flex items-center justify-center text-sm hover:bg-red-900/50 transition-colors shadow-inner"
                      title="강제 삭제"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-black/30 p-3 rounded-xl border border-zinc-700/30">
                <div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase">보유 자산</p>
                  <p className="text-sm font-black text-green-400">₩{u.balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase">비밀번호 확인</p>
                  <p className="text-sm font-mono text-zinc-400">{u.pw}</p>
                </div>
                <div className="col-span-2 mt-1 pt-1 border-t border-zinc-700/30">
                  <p className="text-[9px] text-zinc-500 font-black uppercase">자기소개</p>
                  <p className="text-xs text-zinc-300 truncate">{u.bio || '정보 없음'}</p>
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
