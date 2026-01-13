
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

        setUploadProgress('데이터 동기화 중...');
        const updatedGallery = [...gallery, ...compressedItems];
        setGallery(updatedGallery);
        
        let newProfileImg = img;
        if (isSelf && compressedItems[0]) {
          newProfileImg = compressedItems[0];
          setImg(newProfileImg);
        }

        const fastUpdate = { ...targetUser, gallery: updatedGallery, img: newProfileImg };
        await onUpdateUser(fastUpdate);
        alert(`${compressedItems.length}개의 사진이 추가되었습니다.`);
      } catch (err) {
        alert('업로드 중 오류가 발생했습니다.');
      } finally {
        setIsUploading(false);
        setUploadProgress('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const isAdmin = user.isAdmin;
  const canEdit = isSelf || isAdmin;

  const removePhoto = async (idx: number) => {
    if (!window.confirm('이 사진을 보관함에서 영구 삭제하시겠습니까?')) return;
    const newG = gallery.filter((_, i) => i !== idx);
    setGallery(newG);
    const updatedUser = { ...targetUser, gallery: newG };
    await onUpdateUser(updatedUser);
  };

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
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
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
        <div className="text-center">
          <p className="text-2xl font-black text-white uppercase italic tracking-tighter">{nick || targetUser.id}</p>
          <div className="flex items-center justify-center gap-2 mt-1 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">실시간 접속 중</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">닉네임</label>
          <input 
            type="text" value={nick} onChange={(e) => setNick(e.target.value)} disabled={!canEdit}
            className="w-full bg-black border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all"
            placeholder="이름을 입력하세요"
          />
        </div>

        {isAdmin && (
          <div className="bg-red-500/5 rounded-2xl p-4 border border-red-500/20 animate-slideUp">
            <label className="text-[10px] font-black text-red-500 uppercase mb-2 block tracking-widest flex items-center gap-1">
              <i className="fas fa-shield-alt text-[8px]"></i> 보안 비밀번호 (관리자 전용)
            </label>
            <input 
              type="text" value={pw} onChange={(e) => setPw(e.target.value)}
              className="w-full bg-black border border-red-500/20 rounded-xl py-4 px-5 font-mono font-bold text-yellow-500 focus:outline-none focus:border-red-500 transition-all"
              placeholder="비밀번호 수정"
            />
          </div>
        )}

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">상태 메시지</label>
          <textarea 
            value={bio} onChange={(e) => setBio(e.target.value)} disabled={!canEdit}
            className="w-full bg-black border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white min-h-[100px] focus:outline-none focus:border-yellow-500 resize-none transition-all"
            placeholder="상태를 공유하세요"
          />
        </div>

        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
          <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">보유 자금 (포인트)</label>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 font-black">₩</div>
            <input 
              type="number" value={balance} 
              onChange={(e) => setBalance(Number(e.target.value))}
              disabled={!isAdmin}
              className="w-full bg-transparent font-black text-green-400 text-2xl outline-none"
            />
          </div>
        </div>
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
            {isSaving ? '서버 동기화 중...' : '데이터 저장하기'}
          </button>
          
          <div className="flex gap-2">
            {isSelf && (
              <button onClick={onLogout} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black rounded-2xl text-xs active:bg-zinc-700 transition-colors">
                로그아웃
              </button>
            )}
            <button 
              onClick={() => { if(window.confirm('정말 계정을 파쇄하시겠습니까?')) onDeleteUser(targetUser.id) }}
              className="flex-1 py-4 bg-red-900/10 text-red-500 border border-red-500/20 font-black rounded-2xl text-xs active:bg-red-900/20 transition-colors"
            >
              계정 파쇄
            </button>
          </div>
        </div>
      )}

      {zoomedImg && (
        <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setZoomedImg(null)}>
          <div className="relative max-w-full max-h-full">
            <img src={zoomedImg} alt="Zoomed" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border border-zinc-800" />
            <button className="absolute -top-12 right-0 text-white text-3xl p-2"><i className="fas fa-times"></i></button>
          </div>
        </div>
      )}

      {showMediaLibrary && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-xl">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[3rem] p-7 flex flex-col max-h-[85vh] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <i className="fas fa-shield-alt text-[150px] text-blue-500"></i>
            </div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-yellow-400 italic uppercase leading-none">미디어 보관함</h3>
                <span className="text-[9px] text-zinc-500 font-black mt-1 uppercase tracking-widest">사진 선택 및 관리</span>
              </div>
              <button onClick={() => setShowMediaLibrary(false)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-90 transition-transform"><i className="fas fa-times"></i></button>
            </div>

            {canEdit && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mb-6 w-full py-4 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-700 transition-all active:scale-95 group relative z-10"
              >
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                  <i className="fas fa-plus"></i>
                </div>
                <span className="text-xs font-black text-white uppercase">새 사진 추가하기</span>
              </button>
            )}
            
            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 pr-1 custom-scrollbar relative z-10">
              {gallery.map((src, idx) => (
                <div key={idx} className="aspect-square relative group">
                  <img 
                    src={src} alt="" 
                    onClick={() => { if(canEdit) setImg(src); setShowMediaLibrary(false); }}
                    className="w-full h-full object-cover rounded-2xl border border-zinc-800 hover:border-yellow-500 cursor-pointer transition-all shadow-md"
                  />
                  {canEdit && (
                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                        className="w-7 h-7 bg-red-600 text-white rounded-lg text-[10px] shadow-lg flex items-center justify-center active:scale-90"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                      <a 
                        href={src} download={`media_${idx}.png`}
                        onClick={e => e.stopPropagation()}
                        className="w-7 h-7 bg-blue-600 text-white rounded-lg text-[10px] shadow-lg flex items-center justify-center active:scale-90"
                      >
                        <i className="fas fa-download"></i>
                      </a>
                    </div>
                  )}
                </div>
              ))}
              {gallery.length === 0 && (
                <div className="col-span-3 py-20 text-center opacity-20">
                  <i className="fas fa-images text-4xl mb-2"></i>
                  <p className="text-xs font-black uppercase">보관함이 비어있습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 z-[400] bg-black/90 flex flex-col items-center justify-center backdrop-blur-2xl animate-fadeIn">
          <div className="w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-8"></div>
          <p className="text-2xl font-black text-white italic animate-pulse tracking-tighter uppercase">{uploadProgress || 'Processing...'}</p>
          <p className="text-[10px] text-zinc-500 mt-4 uppercase font-black tracking-[0.5em]">이미지 최적화 및 보안 전송 중</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
