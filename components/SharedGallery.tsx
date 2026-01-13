
import React, { useState, useEffect, useRef } from 'react';
import { User, SharedMedia } from '../types';
import { api } from '../services/apiService';

interface SharedGalleryProps {
  user: User;
}

const SharedGallery: React.FC<SharedGalleryProps> = ({ user }) => {
  const [items, setItems] = useState<SharedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 실시간 구독 시작
    api.subscribeSharedGallery((newItem) => {
      setItems(prev => {
        if (prev.find(item => item.id === newItem.id)) return prev;
        return [newItem, ...prev].sort((a, b) => b.timestamp - a.timestamp);
      });
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) return alert('5MB 이하 파일만 업로드 가능합니다.');

      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const media: SharedMedia = {
          id: `media_${Date.now()}_${user.id}`,
          uploaderId: user.id,
          uploaderNick: user.nick || user.id,
          data: base64,
          timestamp: Date.now(),
          type: file.type.startsWith('video') ? 'video' : 'image'
        };
        
        await api.uploadToSharedGallery(media);
        await api.logEvent(`🖼️ [${user.nick || user.id}]님이 전역 피드에 사진을 공유했습니다.`);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex justify-between items-center bg-zinc-800/30 p-5 rounded-3xl border border-zinc-700/30 shadow-inner">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-yellow-400 leading-none">전역 피드</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">실시간 데이터 스트림</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-xl active:scale-90 transition-all disabled:opacity-50"
        >
          <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-plus'} text-2xl`}></i>
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>

      <div className="grid grid-cols-2 gap-4 pb-24">
        {items.map((item) => (
          <div key={item.id} className="bg-zinc-800/40 border border-zinc-700/30 rounded-[2rem] overflow-hidden shadow-2xl animate-slideUp group">
            <div className="aspect-square bg-zinc-900 flex items-center justify-center overflow-hidden">
              <img src={item.data} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-xs font-black text-white truncate">{item.uploaderNick}</p>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">
                {new Date(item.timestamp).toLocaleTimeString()} 공유됨
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-2 py-32 text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
              <i className="fas fa-camera text-zinc-600 text-2xl"></i>
            </div>
            <p className="text-zinc-500 font-black text-sm uppercase italic tracking-tighter">공유된 사진이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedGallery;
