
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';
import { api } from '../services/apiService';
import { compressImage } from '../services/imageService';

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
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);

  // 비밀번호 재설정 상태
  const [showPwReset, setShowPwReset] = useState(false);
  const [currentPwInput, setCurrentPwInput] = useState('');
  const [newPwInput, setNewPwInput] = useState('');
  const [confirmPwInput, setConfirmPwInput] = useState('');

  useEffect(() => {
    if (targetUser) {
      setNick(targetUser.nick || '');
      setBio(targetUser.bio || '');
      setPw(targetUser.pw || '');
      setImg(targetUser.img || DEFAULT_PROFILE_IMG);
      setBalance(targetUser.balance || 0);
      
      let parsedGallery: string[] = [];
      if (typeof targetUser.gallery === 'string') {
        try { parsedGallery = JSON.parse(targetUser.gallery); } catch (e) { parsedGallery = []; }
      } else if (Array.isArray(targetUser.gallery)) {
        parsedGallery = targetUser.gallery;
      }
      setGallery(parsedGallery);
    }
  }, [targetUser]);

  if (!targetUser) return <div className="p-10 text-center text-zinc-500 font-bold">사용자를 찾을 수 없습니다.</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData: User = { 
        ...targetUser, 
        nick, bio, pw, img, 
        balance: Number(balance), 
        gallery: gallery
      };
      await onUpdateUser(updatedData);
      alert('설정이 성공적으로 반영되었습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (currentPwInput !== targetUser.pw) return alert('현재 비밀번호가 일치하지 않습니다.');
    if (newPwInput.length < 4) return alert('비밀번호는 4자 이상이어야 합니다.');
    if (newPwInput !== confirmPwInput) return alert('새 비밀번호 확인이 일치하지 않습니다.');

    try {
      setIsSaving(true);
      const updatedData: User = { ...targetUser, pw: newPwInput };
      await onUpdateUser(updatedData);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setShowPwReset(false);
      setCurrentPwInput('');
      setNewPwInput('');
      setConfirmPwInput('');
    } catch (err) {
      alert('비밀번호 변경 중 오류 발생');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      setUploadProgress('이미지 최적화 중...');
      try {
        const compressedItems = await Promise.all(
          Array.from(files).map(async (file, idx) => {
            setUploadProgress(`최적화 (${idx + 1}/${files.length})`);
            return await compressImage(file, 1024, 0.7);
          })
        );
        const updatedGallery = [...gallery, ...compressedItems];
        setGallery(updatedGallery);
        let newProfileImg = img;
        if (isSelf && compressedItems[0]) {
          newProfileImg = compressedItems[0];
          setImg(newProfileImg);
        }
        await onUpdateUser({ ...targetUser, gallery: updatedGallery, img: newProfileImg });
        alert(`${compressedItems.length}개의 사진이 추가되었습니다.`);
      } catch (err) {
        alert('업로드 중 오류 발생');
      } finally {
        setIsUploading(false);
        setUploadProgress('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = async (idx: number) => {
    if (!window.confirm('사진을 삭제하시겠습니까?')) return;
    const newG = gallery.filter((_, i) => i !== idx);
    setGallery(newG);
    await onUpdateUser({ ...targetUser, gallery: newG });
  };

  const isAdmin = user.isAdmin;
  const canEdit = isSelf || isAdmin;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-24 relative">
      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />

      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black italic text-yellow-400 uppercase tracking-tighter">회원 정보 설정</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex flex-col items-center gap-4 py-10 bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 rounded-[3rem] border border-zinc-700/50 shadow-2xl relative overflow-hidden">
        <div className="relative group">
          <div 
            onClick={() => setZoomedImg(img)}
            className="w-36 h-36 rounded-full border-4 border-yellow-500 overflow-hidden bg-zinc-700 shadow-[0_0_30px_rgba(234,179,8,0.2)] cursor-zoom-in active:scale-95 transition-transform"
          >
            <img src={img} alt="Profile" className="w-full h-full object-cover" />
          </div>
          {canEdit && (
            <button 
              onClick={() => setShowMediaLibrary(true)}
              className="absolute bottom-1 right-1 w-11 h-11 bg-yellow-500 rounded-full flex items-center justify-center shadow-xl border-4 border-zinc-900 active:scale-90 transition-transform z-20"
            >
              <i className="fas fa-camera text-black text-sm"></i>
            </button>
          )}
        </div>
        <p className="text-2xl font-black text-white uppercase italic tracking-tighter">{nick || targetUser.id}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">닉네임</label>
          <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} disabled={!canEdit} className="w-full bg-black border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white outline-none focus:border-yellow-500 transition-all" />
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">상태 메시지</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} disabled={!canEdit} className="w-full bg-black border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white min-h-[100px] outline-none focus:border-yellow-500 resize-none transition-all" />
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">보유 자금</label>
          <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} disabled={!isAdmin} className="w-full bg-transparent font-black text-green-400 text-2xl outline-none" />
        </div>

        {isSelf && (
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setShowPwReset(!showPwReset)}
              className="w-full py-4 bg-zinc-800/50 border border-zinc-700 text-zinc-400 font-black rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
            >
              <i className="fas fa-lock"></i> {showPwReset ? '비밀번호 재설정 닫기' : '비밀번호 재설정'}
            </button>
            
            {showPwReset && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 animate-slideUp">
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-1 block">현재 비밀번호</label>
                  <input type="password" value={currentPwInput} onChange={e => setCurrentPwInput(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-1 block">새 비밀번호</label>
                  <input type="password" value={newPwInput} onChange={e => setNewPwInput(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-1 block">새 비밀번호 확인</label>
                  <input type="password" value={confirmPwInput} onChange={e => setConfirmPwInput(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-yellow-500" />
                </div>
                <button onClick={handleResetPassword} className="w-full py-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-black rounded-2xl text-xs hover:bg-yellow-500 hover:text-black transition-all">비밀번호 변경 확정</button>
              </div>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex flex-col gap-3 mt-4">
          <button onClick={handleSave} disabled={isSaving} className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-2xl active:scale-95 border-b-4 ${isSaving ? 'bg-zinc-700 text-zinc-500 border-zinc-800' : 'bg-yellow-500 text-black border-yellow-700 hover:brightness-110'}`}>
            {isSaving ? '서버 동기화 중...' : '데이터 저장하기'}
          </button>
          <div className="flex gap-2">
            {isSelf && <button onClick={onLogout} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black rounded-2xl text-xs">로그아웃</button>}
            <button onClick={() => { if(window.confirm('정말 계정을 파쇄하시겠습니까?')) onDeleteUser(targetUser.id) }} className="flex-1 py-4 bg-red-900/10 text-red-500 border border-red-500/20 font-black rounded-2xl text-xs">계정 파쇄</button>
          </div>
        </div>
      )}

      {zoomedImg && (
        <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setZoomedImg(null)}>
          <img src={zoomedImg} alt="Zoomed" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border border-zinc-800" />
        </div>
      )}

      {showMediaLibrary && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-xl">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[3rem] p-7 flex flex-col max-h-[85vh] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-yellow-400 italic uppercase">미디어 보관함</h3>
              <button onClick={() => setShowMediaLibrary(false)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><i className="fas fa-times"></i></button>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="mb-6 w-full py-4 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center gap-3">
              <i className="fas fa-plus text-yellow-500"></i><span className="text-xs font-black text-white">새 사진 추가</span>
            </button>
            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 pr-1 custom-scrollbar">
              {gallery.map((src, idx) => (
                <div key={idx} className="aspect-square relative group">
                  <img src={src} alt="" onClick={() => { if(canEdit) setImg(src); setShowMediaLibrary(false); }} className="w-full h-full object-cover rounded-2xl border border-zinc-800 hover:border-yellow-500 cursor-pointer shadow-md" />
                  <button onClick={(e) => { e.stopPropagation(); removePhoto(idx); }} className="absolute top-1 right-1 w-7 h-7 bg-red-600 text-white rounded-lg text-[10px] shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-trash-alt"></i></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 z-[400] bg-black/90 flex flex-col items-center justify-center backdrop-blur-2xl animate-fadeIn">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-8"></div>
          <p className="text-xl font-black text-white italic animate-pulse">{uploadProgress || 'Processing...'}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
