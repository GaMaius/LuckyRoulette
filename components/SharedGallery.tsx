
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
      if (file.size > 2 * 1024 * 1024) return alert('2MB 이하만 가능합니다.');

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
        await api.logEvent(`🖼️ [${user.nick || user.id}]님이 전역 갤러리에 사진을 공유했습니다.`);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-yellow-400">GLOBAL FEED</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">전 세계 유저들의 실시간 공유</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-camera-retro'} text-xl`}></i>
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>

      <div className="grid grid-cols-2 gap-3 pb-20">
        {items.map((item) => (
          <div key={item.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl overflow-hidden shadow-xl animate-slideUp">
            <div className="aspect-square bg-zinc-900 flex items-center justify-center overflow-hidden">
              <img src={item.data} alt="공유 이미지" className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <p className="text-[11px] font-black text-white truncate">{item.uploaderNick}</p>
              <p className="text-[8px] text-zinc-500 font-bold uppercase">
                {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedGallery;
