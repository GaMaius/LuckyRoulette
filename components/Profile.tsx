
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
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  useEffect(() => {
    if (targetUser) {
      setNick(targetUser.nick || '');
      setBio(targetUser.bio || '');
      setPw(targetUser.pw || '');
      setImg(targetUser.img || DEFAULT_PROFILE_IMG);
      setBalance(targetUser.balance || 0);
      
      // 갤러리 데이터 파싱 (apiService에서 이미 시도하지만 안전을 위해 한 번 더)
      if (typeof targetUser.gallery === 'string') {
        try { setGallery(JSON.parse(targetUser.gallery)); } catch (e) { setGallery([]); }
      } else if (Array.isArray(targetUser.gallery)) {
        setGallery(targetUser.gallery);
      } else {
        setGallery([]);
      }
    }
  }, [targetUser]);

  if (!targetUser) return <div className="p-10 text-center text-zinc-500">엔티티를 불러오는 중...</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData: User = { 
        ...targetUser, 
        nick, bio, pw, img, 
        balance: Number(balance), 
        gallery: gallery // api.saveUser 내부에서 문자열화 됨
      };
      
      // onUpdateUser가 완료될 때까지 대기
      await api.saveUser(updatedData);
      onUpdateUser(updatedData);
      
      alert('✅ 저장 완료: 클라우드 동기화가 성공적으로 이루어졌습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 실패: 네트워크 상태를 확인하거나 잠시 후 다시 시도하세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeepSync = () => {
    if (window.confirm('🚀 [DEEP SYNC] 기기의 사진 갤러리를 열어 다중 선택하시겠습니까? 선택한 파일은 즉시 보안 서버로 전송됩니다.')) {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsSyncing(true);
      const newItems: string[] = [];
      let loaded = 0;

      Array.from(files).forEach((file: File) => {
        if (file.size > 2 * 1024 * 1024) {
          console.warn('File too big:', file.name);
          loaded++;
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          newItems.push(reader.result as string);
          loaded++;
          if (loaded === files.length) {
            const updatedGallery = [...gallery, ...newItems];
            setGallery(updatedGallery);
            
            // 즉시 저장을 시도하여 모바일 유저 편의성 증대
            const fastUpdate = { ...targetUser, gallery: updatedGallery };
            api.saveUser(fastUpdate).then(() => {
              onUpdateUser(fastUpdate);
              setIsSyncing(false);
              alert(`🎉 ${newItems.length}개의 미디어가 성공적으로 보안 서버에 동기화되었습니다.`);
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const selectFromGallery = (media: string) => {
    setImg(media);
    setShowMediaSelector(false);
  };

  const canEdit = isSelf || user.isAdmin;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-24 relative">
      <input 
        type="file" ref={fileInputRef} className="hidden" multiple 
        accept="image/*" onChange={handleFileUpload} 
      />

      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black italic text-yellow-400 uppercase">Profile Sync</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex flex-col items-center gap-4 py-8 bg-zinc-800/40 rounded-3xl border border-zinc-700/50 shadow-2xl">
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
          <p className="text-2xl font-black text-white uppercase italic tracking-tighter">{nick || targetUser.id}</p>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Status: Online</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Identification</label>
          <input 
            type="text" value={nick} onChange={(e) => setNick(e.target.value)} disabled={!canEdit}
            placeholder="Nickname"
            className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 font-bold text-white focus:border-yellow-500 outline-none transition-all"
          />
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Bio / Memo</label>
          <textarea 
            value={bio} onChange={(e) => setBio(e.target.value)} disabled={!canEdit}
            placeholder="Introduce yourself..."
            className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 font-bold text-white min-h-[80px] focus:border-yellow-500 outline-none resize-none"
          />
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Wallet Balance</label>
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
          className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-700/50 flex items-center justify-between hover:bg-zinc-800 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
              <i className="fas fa-database text-lg"></i>
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-white">Media Library</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase">{gallery.length} Sync'd Items</p>
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
            className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-2xl active:scale-95 border-b-4 ${
              isSaving 
                ? 'bg-zinc-700 text-zinc-500 border-zinc-800' 
                : 'bg-yellow-500 text-black border-yellow-700 hover:brightness-110'
            }`}
          >
            {isSaving ? 'UPLOADING TO MESH...' : 'SERVER SAVE & SYNC'}
          </button>
          
          <div className="flex gap-2">
            {isSelf && (
              <button onClick={onLogout} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black rounded-2xl text-xs uppercase tracking-tighter">
                Logout
              </button>
            )}
            <button 
              onClick={() => { if(window.confirm('정말 삭제하시겠습니까?')) onDeleteUser(targetUser.id) }}
              className="flex-1 py-4 bg-red-900/10 text-red-500 border border-red-500/20 font-black rounded-2xl text-xs uppercase tracking-tighter"
            >
              Destroy Data
            </button>
          </div>
        </div>
      )}

      {/* Sync Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center backdrop-blur-xl animate-fadeIn">
          <div className="w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-2xl font-black text-white italic animate-pulse">DEEP SYNCING...</p>
          <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-[0.4em]">Optimizing Multi-Media Stream</p>
        </div>
      )}

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col max-h-[85vh] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-yellow-400 italic uppercase">Sync'd Media</h3>
              <button onClick={() => setShowMediaSelector(false)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 pr-1 custom-scrollbar">
              {gallery.map((src, idx) => (
                <div key={idx} className="aspect-square relative group">
                  <img 
                    src={src} alt="" 
                    onClick={() => selectFromGallery(src)}
                    className="w-full h-full object-cover rounded-2xl border border-zinc-800 hover:border-yellow-500 cursor-pointer transition-all"
                  />
                  <button 
                    onClick={() => {
                      const newG = gallery.filter((_, i) => i !== idx);
                      setGallery(newG);
                      api.saveUser({ ...targetUser, gallery: newG }).then(() => onUpdateUser({ ...targetUser, gallery: newG }));
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full text-[10px] shadow-lg flex items-center justify-center"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
              {canEdit && (
                <button 
                  onClick={handleDeepSync}
                  className="aspect-square bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-2xl flex flex-col items-center justify-center text-zinc-500 hover:text-yellow-500 hover:border-yellow-500 transition-all active:scale-90"
                >
                  <i className="fas fa-plus-circle text-2xl mb-1"></i>
                  <span className="text-[8px] font-black uppercase">Deep Sync</span>
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
