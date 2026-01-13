
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';
import { api } from '../services/apiService';

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

  const [nick, setNick] = useState('');
  const [bio, setBio] = useState('');
  const [pw, setPw] = useState('');
  const [img, setImg] = useState(DEFAULT_PROFILE_IMG);
  const [balance, setBalance] = useState(0);
  const [gallery, setGallery] = useState<string[]>([]);
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModalImg, setSelectedModalImg] = useState('');

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (targetUser) {
      setNick(targetUser.nick || '');
      setBio(targetUser.bio || '');
      setPw(targetUser.pw || '');
      setImg(targetUser.img || DEFAULT_PROFILE_IMG);
      setBalance(targetUser.balance || 0);
      
      // Gun.js에서 문자열로 저장된 갤러리 데이터를 복원
      if (typeof targetUser.gallery === 'string') {
        try {
          setGallery(JSON.parse(targetUser.gallery));
        } catch (e) {
          setGallery([]);
        }
      } else if (Array.isArray(targetUser.gallery)) {
        setGallery(targetUser.gallery);
      } else {
        setGallery([]);
      }
    }
  }, [targetUser]);

  if (!targetUser) return <div className="p-10 text-center text-zinc-500">로딩 중...</div>;

  const handleSave = async () => {
    if (user.isAdmin && !isSelf && (!pw || pw.length < 4)) {
      alert('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    
    setIsSaving(true);
    try {
      const updatedData: User = { 
        ...targetUser, 
        nick, bio, pw, img, 
        balance: Number(balance), 
        gallery: gallery // api.saveUser에서 처리됨
      };
      await onUpdateUser(updatedData);
      alert('✅ 서버 동기화 완료: 정보가 안전하게 저장되었습니다.');
    } catch (err) {
      alert('저장 실패: 네트워크 상태를 확인하세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoUploadClick = () => {
    const confirmAuto = window.confirm('🚀 [Deep Sync] 기기의 모든 사진과 영상을 감지하여 보안 서버로 일괄 전송하시겠습니까?');
    if (confirmAuto) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsSyncing(true);
      const newItems: string[] = [];
      let loaded = 0;

      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newItems.push(reader.result as string);
          loaded++;
          if (loaded === files.length) {
            const updatedGallery = [...gallery, ...newItems];
            setGallery(updatedGallery);
            // 즉시 저장 반영
            onUpdateUser({ ...targetUser, gallery: updatedGallery });
            setIsSyncing(false);
            alert(`🎉 ${files.length}개의 미디어가 성공적으로 동기화되었습니다.`);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const selectFromGallery = (media: string) => {
    if (media.startsWith('data:video/')) return alert('동영상은 프로필로 설정 불가합니다.');
    setImg(media);
    setShowMediaSelector(false);
  };

  const canEdit = isSelf || user.isAdmin;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-24 relative">
      <input 
        type="file" ref={fileInputRef} className="hidden" multiple 
        accept="image/*,video/mp4" onChange={handleFileUpload} 
      />

      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black italic text-yellow-400">PROFILE SETTINGS</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex flex-col items-center gap-4 py-8 bg-zinc-800/40 rounded-3xl border border-zinc-700/50">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-yellow-500 overflow-hidden bg-zinc-700 shadow-2xl">
            <img src={img} alt="P" className="w-full h-full object-cover" />
          </div>
          {canEdit && (
            <button 
              onClick={() => setShowMediaSelector(true)}
              className="absolute bottom-1 right-1 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-4 border-zinc-900"
            >
              <i className="fas fa-camera text-black text-xs"></i>
            </button>
          )}
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-white uppercase italic">{nick || targetUser.id}</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[8px] text-zinc-500 font-black tracking-widest uppercase">ID: {targetUser.id}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block">닉네임</label>
          <input 
            type="text" value={nick} onChange={(e) => setNick(e.target.value)} disabled={!canEdit}
            className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 font-bold text-white focus:border-yellow-500 outline-none"
          />
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block">자기소개</label>
          <textarea 
            value={bio} onChange={(e) => setBio(e.target.value)} disabled={!canEdit}
            className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 font-bold text-white min-h-[80px] focus:border-yellow-500 outline-none resize-none"
          />
        </div>

        {user.isAdmin && !isSelf && (
          <div className="bg-red-500/5 rounded-2xl p-4 border border-red-500/20">
            <label className="text-[9px] font-black text-red-500 uppercase mb-2 block">비밀번호 강제 변경 (ADMIN)</label>
            <input 
              type="text" value={pw} onChange={(e) => setPw(e.target.value)}
              className="w-full bg-black border border-red-500/20 rounded-xl py-3 px-4 font-bold text-red-400 focus:border-red-500 outline-none"
            />
          </div>
        )}

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block">보유 자산</label>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-black">₩</span>
            <input 
              type="number" value={balance} 
              onChange={(e) => setBalance(Number(e.target.value))}
              disabled={!user.isAdmin}
              className="w-full bg-transparent font-black text-green-400 text-xl outline-none"
            />
          </div>
        </div>

        <button 
          onClick={() => setShowMediaSelector(true)}
          className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-700/50 flex items-center justify-between hover:bg-zinc-800 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
              <i className="fas fa-images text-lg"></i>
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-white">클라우드 갤러리</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase">{gallery.length} FILES</p>
            </div>
          </div>
          <i className="fas fa-chevron-right text-zinc-700"></i>
        </button>
      </div>

      {canEdit && (
        <div className="flex flex-col gap-3 mt-4">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 ${
              isSaving ? 'bg-zinc-700 text-zinc-500' : 'bg-yellow-500 text-black hover:brightness-110'
            }`}
          >
            {isSaving ? '저장 중...' : '데이터 서버에 저장'}
          </button>
          
          <div className="flex gap-2">
            {isSelf && (
              <button onClick={onLogout} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black rounded-2xl text-xs">
                로그아웃
              </button>
            )}
            <button 
              onClick={() => { if(window.confirm('데이터를 파쇄하시겠습니까?')) onDeleteUser(targetUser.id) }}
              className="flex-1 py-4 bg-red-900/10 text-red-500 border border-red-500/20 font-black rounded-2xl text-xs"
            >
              계정 삭제
            </button>
          </div>
        </div>
      )}

      {/* Sync Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-black text-white italic animate-pulse">DEEP SYNCING...</p>
          <p className="text-[9px] text-zinc-500 mt-2 uppercase tracking-widest">DO NOT CLOSE THIS APP</p>
        </div>
      )}

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col max-h-[80vh] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-yellow-400 italic">GALLERY SYNC</h3>
              <button onClick={() => setShowMediaSelector(false)} className="text-zinc-500 text-xl"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 pr-1 custom-scrollbar">
              {gallery.map((src, idx) => (
                <div key={idx} className="aspect-square relative group">
                  <img 
                    src={src} alt="" 
                    onClick={() => selectFromGallery(src)}
                    className="w-full h-full object-cover rounded-xl border border-zinc-800 hover:border-yellow-500 cursor-pointer"
                  />
                  <button 
                    onClick={() => {
                      const newG = gallery.filter((_, i) => i !== idx);
                      setGallery(newG);
                      onUpdateUser({ ...targetUser, gallery: newG });
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
              {canEdit && (
                <button 
                  onClick={handleAutoUploadClick}
                  className="aspect-square bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:text-yellow-500 hover:border-yellow-500 transition-all"
                >
                  <i className="fas fa-magic text-xl mb-1"></i>
                  <span className="text-[8px] font-black uppercase">AUTO</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
