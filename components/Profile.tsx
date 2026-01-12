
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onLogout: () => void;
  targetUsers?: Record<string, User>;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onDeleteUser, onLogout, targetUsers }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isSelf = !id || id === user.id;
  const targetUser = isSelf ? user : (targetUsers?.[id!] || null);

  const [nick, setNick] = useState(targetUser?.nick || '');
  const [bio, setBio] = useState(targetUser?.bio || '');
  const [img, setImg] = useState(targetUser?.img || DEFAULT_PROFILE_IMG);

  useEffect(() => {
    if (targetUser) {
      setNick(targetUser.nick);
      setBio(targetUser.bio);
      setImg(targetUser.img || DEFAULT_PROFILE_IMG);
    }
  }, [targetUser]);

  if (!targetUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <i className="fas fa-user-slash text-4xl mb-4"></i>
        <p className="font-bold">사용자를 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-yellow-400 font-bold">돌아가기</button>
      </div>
    );
  }

  const handleSave = () => {
    onUpdateUser({ ...targetUser, nick, bio, img });
    alert('프로필이 저장되었습니다.');
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 계정을 삭제하시겠습니까? 모든 자산과 정보가 영구 삭제됩니다.')) {
      onDeleteUser(targetUser.id);
      if (isSelf) {
        // 내 계정인 경우, 로그아웃 처리됨 (App.tsx의 deleteUser에서 처리)
        navigate('/login');
      } else {
        // 관리자가 삭제한 경우
        navigate('/admin');
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const canEdit = isSelf || user.isAdmin;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black italic tracking-tighter text-yellow-400">
          {isSelf ? '내 프로필' : '플레이어 정보'}
        </h2>
        <div className="w-5"></div>
      </div>

      <div className="flex flex-col items-center gap-4 py-8 bg-zinc-800/40 rounded-3xl border border-zinc-700/50">
        <div className="relative">
          <img 
            src={img} 
            alt="프로필" 
            className="w-32 h-32 rounded-full border-4 border-yellow-500 object-cover shadow-2xl" 
          />
          {canEdit && (
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg transform hover:scale-110 transition-transform">
              <i className="fas fa-camera text-black"></i>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-white">{nick || targetUser.id}</p>
          <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">ID: {targetUser.id}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">닉네임</label>
          {canEdit ? (
            <input 
              type="text" 
              value={nick} 
              onChange={(e) => setNick(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl py-3 px-4 font-bold text-white focus:outline-none focus:border-yellow-500"
              placeholder="닉네임 입력"
            />
          ) : (
            <p className="text-lg font-bold">{targetUser.nick || '닉네임 없음'}</p>
          )}
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">자기소개</label>
          {canEdit ? (
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl py-3 px-4 font-bold text-white focus:outline-none focus:border-yellow-500 min-h-[100px]"
              placeholder="자신을 한 줄로 표현해보세요."
            />
          ) : (
            <p className="text-sm text-zinc-300 leading-relaxed">{targetUser.bio || '자기소개가 없습니다.'}</p>
          )}
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50 flex justify-between items-center">
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">총 자산</label>
            <p className="text-xl font-black text-green-400">₩{targetUser.balance.toLocaleString()}</p>
          </div>
          <i className="fas fa-wallet text-yellow-500 text-2xl opacity-40"></i>
        </div>
      </div>

      {canEdit && (
        <div className="flex flex-col gap-3 mt-4">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-yellow-500 text-black font-black rounded-xl shadow-lg active:scale-95 transition-all"
          >
            변경사항 저장하기
          </button>
          
          <div className="flex gap-3">
            {isSelf && (
              <button 
                onClick={onLogout}
                className="flex-1 py-3 bg-zinc-700 text-white font-bold rounded-xl active:scale-95 transition-all text-sm"
              >
                로그아웃
              </button>
            )}
            <button 
              onClick={handleDelete}
              className="flex-1 py-3 bg-red-600/10 text-red-500 border border-red-500/30 font-bold rounded-xl active:scale-95 transition-all text-sm"
            >
              계정 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
