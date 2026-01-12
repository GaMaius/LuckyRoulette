
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
  const [balance, setBalance] = useState(targetUser?.balance || 0);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (targetUser) {
      setNick(targetUser.nick);
      setBio(targetUser.bio);
      setImg(targetUser.img || DEFAULT_PROFILE_IMG);
      setBalance(targetUser.balance);
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
    onUpdateUser({ ...targetUser, nick, bio, img, balance: Number(balance) });
    alert('프로필 정보가 안전하게 저장되었습니다.');
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 계정을 영구적으로 삭제하시겠습니까? 삭제된 정보는 다시 복구할 수 없습니다.')) {
      onDeleteUser(targetUser.id);
      if (isSelf) {
        navigate('/login', { replace: true });
      } else {
        navigate('/admin', { replace: true });
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

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = img;
    link.download = `${targetUser.id}_profile.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 본인이거나 관리자일 때만 수정 가능
  const canEdit = isSelf || user.isAdmin;
  // 관리자가 타인을 보고 있을 때만 자산 직접 수정 노출
  const isAdminModifyingOthers = user.isAdmin && !isSelf;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black italic tracking-tighter text-yellow-400">
          {isSelf ? '내 프로필 관리' : '회원 정보 열람'}
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="flex flex-col items-center gap-4 py-8 bg-zinc-800/40 rounded-3xl border border-zinc-700/50 shadow-inner">
        <div className="relative">
          <img 
            src={img} 
            alt="프로필 사진" 
            onClick={() => setShowImageModal(true)}
            className="w-32 h-32 rounded-full border-4 border-yellow-500 object-cover shadow-2xl bg-zinc-700 cursor-pointer hover:brightness-110 transition-all" 
          />
          {canEdit && (
            <label className="absolute bottom-1 right-1 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg transform active:scale-90 transition-transform hover:brightness-110">
              <i className="fas fa-camera text-black text-sm"></i>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-white">{nick || targetUser.id}</p>
          <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase flex items-center justify-center gap-1">
            아이디: {targetUser.id} {targetUser.isAdmin && <span className="text-[9px] bg-red-600 text-white px-1 rounded ml-1">ADMIN</span>}
          </p>
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
              className="w-full bg-black border border-zinc-700 rounded-xl py-3 px-4 font-bold text-white focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="닉네임을 입력하세요"
            />
          ) : (
            <p className="text-lg font-bold text-zinc-100">{targetUser.nick || '설정된 닉네임 없음'}</p>
          )}
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">자기소개</label>
          {canEdit ? (
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl py-3 px-4 font-bold text-white focus:outline-none focus:border-yellow-500 min-h-[100px] transition-colors resize-none"
              placeholder="자신을 한 줄로 소개해보세요."
            />
          ) : (
            <p className="text-sm text-zinc-300 leading-relaxed">{targetUser.bio || '등록된 자기소개가 없습니다.'}</p>
          )}
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50 flex justify-between items-center shadow-lg">
          <div className="flex-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">총 자산</label>
            {isAdminModifyingOthers ? (
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-black">₩</span>
                <input 
                  type="number" 
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="bg-black/50 border border-zinc-700 rounded-lg px-2 py-1 text-green-400 font-black w-full focus:outline-none focus:border-green-500"
                />
              </div>
            ) : (
              <p className="text-xl font-black text-green-400">₩{targetUser.balance.toLocaleString()}</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center ml-4">
            <i className="fas fa-wallet text-green-500 text-xl"></i>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex flex-col gap-3 mt-6">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-yellow-500 text-black font-black rounded-2xl shadow-xl shadow-yellow-500/10 active:scale-95 transition-all hover:brightness-110"
          >
            변경 내용 저장하기
          </button>
          
          <div className="flex gap-3 mt-2">
            {isSelf && (
              <button 
                onClick={onLogout}
                className="flex-1 py-4 bg-zinc-700 text-white font-black rounded-2xl active:scale-95 transition-all text-sm hover:bg-zinc-600"
              >
                로그아웃
              </button>
            )}
            <button 
              onClick={handleDelete}
              className="flex-1 py-4 bg-red-600/10 text-red-500 border border-red-500/30 font-black rounded-2xl active:scale-95 transition-all text-sm hover:bg-red-600/20"
            >
              계정 삭제
            </button>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {showImageModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowImageModal(false)}
        >
          <div className="absolute top-6 right-6 flex gap-4">
            {/* 관리자(admin)만 다운로드 버튼이 보임 */}
            {user.isAdmin && (
              <button 
                onClick={(e) => { e.stopPropagation(); downloadImage(); }}
                className="w-12 h-12 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors shadow-lg"
                title="이미지 다운로드"
              >
                <i className="fas fa-download"></i>
              </button>
            )}
            <button 
              onClick={() => setShowImageModal(false)}
              className="w-12 h-12 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <img 
            src={img} 
            alt="확대 이미지" 
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain border border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="mt-6 text-zinc-500 text-xs font-bold uppercase tracking-widest">
            {user.isAdmin ? "관리자 권한으로 다운로드가 가능합니다." : "이미지 열람 모드 (일반 회원은 다운로드가 제한됩니다)"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile;
