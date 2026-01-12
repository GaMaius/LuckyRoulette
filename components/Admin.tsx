
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
  const userList = Object.values(users) as User[];

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className="text-center py-4">
        <h2 className="text-2xl font-black italic tracking-tighter text-red-500">관리자 패널</h2>
        <p className="text-xs text-zinc-500 font-bold uppercase mt-1">사용자 및 시스템 관리</p>
      </div>

      <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-700/50 mb-4">
        <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
          <span>총 가입 사용자 수</span>
          <span className="text-white text-lg">{userList.length}명</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {userList.map((u) => (
          <div
            key={u.id}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <img 
                src={u.img || DEFAULT_PROFILE_IMG} 
                alt={u.id} 
                className="w-10 h-10 rounded-full object-cover border border-zinc-700"
              />
              <div>
                <p className="font-bold text-zinc-100 flex items-center gap-2">
                  {u.id} 
                  {u.isAdmin && <span className="text-[7px] bg-red-500 px-1 py-0.5 rounded text-white font-black">ADMIN</span>}
                </p>
                <p className="text-[10px] text-zinc-500">자산: ₩{u.balance.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate(`/profile/${u.id}`)}
                className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center text-xs hover:bg-zinc-600 transition-colors"
                title="프로필 편집"
              >
                <i className="fas fa-user-edit"></i>
              </button>
              {!u.isAdmin && (
                <button 
                  onClick={() => {
                    if (window.confirm(`${u.id} 사용자를 정말로 강제 추방(삭제)하시겠습니까?`)) {
                      onDeleteUser(u.id);
                    }
                  }}
                  className="w-9 h-9 rounded-lg bg-red-900/30 text-red-500 flex items-center justify-center text-xs hover:bg-red-800/50 transition-colors"
                  title="사용자 삭제"
                >
                  <i className="fas fa-user-minus"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
