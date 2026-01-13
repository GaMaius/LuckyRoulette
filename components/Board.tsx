
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Post } from '../types';
import { api } from '../services/apiService';
import { compressImage } from '../services/imageService';

interface BoardProps {
  user: User;
  posts: Post[];
}

const Board: React.FC<BoardProps> = ({ user, posts }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [img, setImg] = useState<string | null>(null);
  const [isNotice, setIsNotice] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (a.isNotice && !b.isNotice) return -1;
      if (!a.isNotice && b.isNotice) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [posts]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const base64 = await compressImage(file, 1200, 0.8);
      setImg(base64);
    } catch (err) {
      alert('이미지 처리 중 오류 발생');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 입력해주세요.');
    const post: Post = {
      id: `post_${Date.now()}_${user.id}`,
      title, content, img: img || undefined,
      uploaderId: user.id, uploaderNick: user.nick,
      timestamp: Date.now(), isNotice: user.isAdmin ? isNotice : false,
      comments: []
    };
    await api.savePost(post);
    setTitle(''); setContent(''); setImg(null); setShowModal(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-24">
      <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-yellow-400 leading-none">COMMUNITY</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">자유 게시판</p>
        </div>
        <button onClick={() => setShowModal(true)} className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-xl active:scale-90 transition-all"><i className="fas fa-plus text-xl"></i></button>
      </div>

      <div className="grid gap-3">
        {sortedPosts.map((post) => (
          <div key={post.id} onClick={() => navigate(`/feed/${post.id}`)} 
               className={`p-5 rounded-2xl border transition-all cursor-pointer active:scale-95 group ${post.isNotice ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              {post.isNotice && <span className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded">NOTICE</span>}
              <span className="text-[9px] text-zinc-500 font-black uppercase">{new Date(post.timestamp).toLocaleDateString()}</span>
            </div>
            <h3 className={`text-sm font-black mb-1 group-hover:text-yellow-500 transition-colors ${post.isNotice ? 'text-yellow-500' : 'text-zinc-100'}`}>{post.title}</h3>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-zinc-500 font-bold">{post.uploaderNick}</span>
              <div className="flex items-center gap-3 text-zinc-600 text-[10px] font-black">
                <span className="flex items-center gap-1"><i className="far fa-comment-dots"></i> {post.comments?.length || 0}</span>
                {post.img && <i className="far fa-image"></i>}
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && <div className="py-20 text-center text-zinc-600 font-black uppercase text-xs">게시글이 없습니다</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 flex flex-col gap-6 shadow-2xl">
            <div className="flex justify-between items-center"><h2 className="text-xl font-black italic text-yellow-400">새 글 작성</h2><button onClick={() => setShowModal(false)} className="text-zinc-500"><i className="fas fa-times text-xl"></i></button></div>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-yellow-500" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용" className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-yellow-500 min-h-[200px] resize-none" />
            <div className="flex items-center gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-zinc-800 rounded-xl text-[10px] font-black text-zinc-400 flex items-center gap-2"><i className="fas fa-image"></i> {img ? '변경' : '사진 추가'}</button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              {user.isAdmin && <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isNotice} onChange={e => setIsNotice(e.target.checked)} className="accent-yellow-500" /><span className="text-[10px] font-black text-yellow-500">공지 설정</span></label>}
            </div>
            <button onClick={handleSave} disabled={isUploading} className="w-full py-5 bg-yellow-500 text-black font-black rounded-2xl shadow-xl">게시하기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
