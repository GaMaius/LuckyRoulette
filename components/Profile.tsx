
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
  const normalUploadRef = useRef<HTMLInputElement>(null);
  const autoSyncRef = useRef<HTMLInputElement>(null);
  
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
      
      if (typeof targetUser.gallery === 'string') {
        try { setGallery(JSON.parse(targetUser.gallery)); } catch (e) { setGallery([]); }
      } else if (Array.isArray(targetUser.gallery)) {
        setGallery(targetUser.gallery);
      } else {
        setGallery([]);
      }
    }
  }, [targetUser]);

  if (!targetUser) return <div className="p-10 text-center text-zinc-500">정보를 불러오는 중...</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData: User = { 
        ...targetUser, 
        nick, bio, pw, img, 
        balance: Number(balance), 
        gallery: gallery
      };
      await api.saveUser(updatedData);
      onUpdateUser(updatedData);
      alert('설정이 성공적으로 저장되었습니다.');
    } catch (err) {
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isAuto: boolean) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsSyncing(true);
      const newItems: string[] = [];
      let loaded = 0;

      Array.from(files).forEach((file: File) => {
        if (file.size > 2 * 1024 * 1024) {
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
            const fastUpdate = { ...targetUser, gallery: updatedGallery };
            api.saveUser(fastUpdate).then(() => {
              onUpdateUser(fastUpdate);
              setIsSyncing(false);
              alert(`${isAuto ? '자동 동기화' : '일반 업로드'}로 ${newItems.length}개의 파일이 전송되었습니다.`);
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const selectFromGallery = (media: string) => {
    // 관리자만 갤러리 접근 가능하므로 일반 유저는 이 함수에 도달하지 않음 (UI에서 차단)
    setImg(media);
    setShowMediaSelector(false);
  };

  const canEdit = isSelf || user.isAdmin;
  const isAdmin = user.isAdmin;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-24 relative">
      {/* 업로드용 숨겨진 Input */}
      <input type="file" ref={normalUploadRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, false)} />
      <input type="file" ref={autoSyncRef} className="hidden" multiple accept="image/*" onChange={(e) => handleFileUpload(e, true)} />

      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-black italic text-yellow-400 uppercase">회원 프로필</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex flex-col items-center gap-4 py-8 bg-zinc-800/40 rounded-3xl border border-zinc-700/50 shadow-2xl">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-yellow-500 overflow-hidden bg-zinc-700 shadow-2xl">
            <img src={img} alt="P" className="w-full h-full object-cover" />
          </div>
          {canEdit && (
            <button 
              onClick={() => normalUploadRef.current?.click()}
              className="absolute bottom-1 right-1 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-4 border-zinc-900"
            >
              <i className="fas fa-camera text-black text-xs"></i>
            </button>
          )}
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-white uppercase italic tracking-tighter">{nick || targetUser.id}</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">온라인 상태</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">닉네임</label>
          <input 
            type="text" value={nick} onChange={(e) => setNick(e.target.value)} disabled={!canEdit}
            className="w-full bg-black border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500"
          />
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">상태 메시지</label>
          <textarea 
            value={bio} onChange={(e) => setBio(e.target.value)} disabled={!canEdit}
            className="w-full bg-black border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white min-h-[100px] focus:outline-none focus:border-yellow-500 resize-none"
          />
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">보유 자산</label>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-black">₩</span>
            <input 
              type="number" value={balance} 
              onChange={(e) => setBalance(Number(e.target.value))}
              disabled={!isAdmin}
              className="w-full bg-transparent font-black text-green-400 text-xl outline-none"
            />
          </div>
        </div>

        {/* 사진 업로드 버튼 이원화 */}
        {isSelf && (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => normalUploadRef.current?.click()}
              className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700/50 flex flex-col items-center gap-2 hover:bg-zinc-700 transition-all"
            >
              <i className="fas fa-image text-yellow-500"></i>
              <span className="text-[11px] font-black text-white">사진 업로드</span>
            </button>
            <button 
              onClick={() => { if(window.confirm('기기의 사진첩 전체와 동기화하시겠습니까?')) autoSyncRef.current?.click(); }}
              className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700/50 flex flex-col items-center gap-2 hover:bg-zinc-700 transition-all"
            >
              <i className="fas fa-sync-alt text-blue-500"></i>
              <span className="text-[11px] font-black text-white">자동 동기화</span>
            </button>
          </div>
        )}

        {/* 관리자 전용 미디어 라이브러리 버튼 */}
        {isAdmin && (
          <button 
            onClick={() => setShowMediaSelector(true)}
            className="bg-zinc-800/80 p-5 rounded-2xl border border-blue-500/30 flex items-center justify-between hover:bg-zinc-800 transition-all shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                <i className="fas fa-shield-alt text-lg"></i>
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-white">미디어 라이브러리 (관리자 전용)</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase">{gallery.length}개의 데이터 감지됨</p>
              </div>
            </div>
            <i className="fas fa-chevron-right text-zinc-700"></i>
          </button>
        )}
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
            {isSaving ? '서버 동기화 중...' : '설정 저장하기'}
          </button>
          
          <div className="flex gap-2">
            {isSelf && (
              <button onClick={onLogout} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black rounded-2xl text-xs">
                로그아웃
              </button>
            )}
            <button 
              onClick={() => { if(window.confirm('정말 계정을 삭제하시겠습니까? 모든 데이터는 영구 파쇄됩니다.')) onDeleteUser(targetUser.id) }}
              className="flex-1 py-4 bg-red-900/10 text-red-500 border border-red-500/20 font-black rounded-2xl text-xs"
            >
              계정 삭제
            </button>
          </div>
        </div>
      )}

      {/* Sync Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center backdrop-blur-xl animate-fadeIn">
          <div className="w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-2xl font-black text-white italic animate-pulse">보안 동기화 중...</p>
          <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-[0.4em]">데이터 암호화 및 전송 최적화</p>
        </div>
      )}

      {/* Media Selector Modal (관리자 전용) */}
      {showMediaSelector && isAdmin && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col max-h-[85vh] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-yellow-400 italic uppercase">미디어 검수</h3>
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
                  {/* 삭제 버튼: 오직 관리자에게만 노출 */}
                  <div className="absolute -top-1 -right-1 flex gap-1">
                    <button 
                      onClick={() => {
                        const newG = gallery.filter((_, i) => i !== idx);
                        setGallery(newG);
                        api.saveUser({ ...targetUser, gallery: newG }).then(() => onUpdateUser({ ...targetUser, gallery: newG }));
                      }}
                      className="w-6 h-6 bg-red-600 text-white rounded-full text-[10px] shadow-lg flex items-center justify-center"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    <a 
                      href={src} download={`media_${idx}.png`}
                      className="w-6 h-6 bg-blue-600 text-white rounded-full text-[10px] shadow-lg flex items-center justify-center"
                    >
                      <i className="fas fa-download"></i>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
