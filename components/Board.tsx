
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Post, Comment } from '../types';
import { api } from '../services/apiService';
import { compressImage } from '../services/imageService';

interface BoardProps {
  user: User;
}

const Board: React.FC<BoardProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [img, setImg] = useState<string | null>(null);
  const [isNotice, setIsNotice] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.subscribeBoard((post) => {
      setPosts(prev => {
        const idx = prev.findIndex(p => p.id === post.id);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = post;
          return next;
        }
        return [...prev, post];
      });
    });
  }, []);

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
    if (file.size > 20 * 1024 * 1024) return alert('파일 크기는 20MB 이하여야 합니다.');
    
    setIsUploading(true);
    try {
      const base64 = await compressImage(file, 1200, 0.8);
      setImg(base64);
    } catch (err) {
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImg(null);
    setIsNotice(false);
    setEditingPost(null);
    setShowModal(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 입력해주세요.');
    const post: Post = {
      id: editingPost?.id || `post_${Date.now()}_${user.id}`,
      title,
      content,
      img: img || undefined,
      uploaderId: editingPost?.uploaderId || user.id,
      uploaderNick: editingPost?.uploaderNick || user.nick,
      timestamp: editingPost?.timestamp || Date.now(),
      isNotice: user.isAdmin ? isNotice : false,
      comments: editingPost?.comments || []
    };
    await api.savePost(post);
    resetForm();
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const addComment = async (post: Post, text: string) => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: `comment_${Date.now()}_${user.id}`,
      uploaderId: user.id,
      uploaderNick: user.nick,
      text,
      timestamp: Date.now()
    };
    const updatedPost = { ...post, comments: [...(post.comments || []), newComment] };
    await api.savePost(updatedPost);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-24">
      <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-yellow-400">커뮤니티 광장</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">자유로운 정보 공유와 소통</p>
        </div>
        <button onClick={() => setShowModal(true)} className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-xl active:scale-90 transition-all">
          <i className="fas fa-edit text-xl"></i>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {sortedPosts.map((post) => (
          <div key={post.id} className={`bg-zinc-900/80 border rounded-[2rem] overflow-hidden transition-all shadow-xl flex flex-col ${post.isNotice ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-zinc-800'}`}>
            {post.isNotice && (
              <div className="bg-yellow-500/10 px-6 py-2 border-b border-yellow-500/20 flex items-center gap-2">
                <i className="fas fa-bullhorn text-[10px] text-yellow-500"></i>
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">공지사항</span>
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600 font-black">
                    {post.uploaderNick[0]}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{post.uploaderNick}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">{new Date(post.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                {(user.id === post.uploaderId || user.isAdmin) && (
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingPost(post);
                      setTitle(post.title);
                      setContent(post.content);
                      setImg(post.img || null);
                      setIsNotice(post.isNotice || false);
                      setShowModal(true);
                    }} className="text-zinc-500 hover:text-yellow-500 p-2"><i className="fas fa-pen text-xs"></i></button>
                    <button onClick={() => handleDelete(post.id)} className="text-zinc-500 hover:text-red-500 p-2"><i className="fas fa-trash text-xs"></i></button>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-black text-white mb-2">{post.title}</h3>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{post.content}</p>
              {post.img && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner">
                  <img src={post.img} alt="" className="w-full h-auto object-cover max-h-[400px]" />
                </div>
              )}
            </div>
            
            <div className="bg-black/20 p-6 border-t border-zinc-800/50">
              <div className="flex flex-col gap-3 mb-4">
                {post.comments?.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex-1 bg-zinc-800/50 px-4 py-3 rounded-2xl">
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] font-black text-yellow-500/80">{c.uploaderNick}</span>
                        <span className="text-[9px] text-zinc-600 font-bold">{new Date(c.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-medium">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="댓글을 남겨보세요..." 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addComment(post, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 flex flex-col gap-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black italic text-yellow-400 uppercase">{editingPost ? '글 수정' : '새 글 작성'}</h2>
              <button onClick={resetForm} className="text-zinc-500 hover:text-white"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요" className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-yellow-500" />
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용을 입력하세요" className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-yellow-500 min-h-[150px] resize-none" />
              
              <div className="flex items-center gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-zinc-800 rounded-xl text-xs font-black text-zinc-400 hover:text-white transition-all flex items-center gap-2">
                  <i className="fas fa-image"></i> {img ? '사진 변경' : '사진 추가 (MAX 20MB)'}
                </button>
                {img && <button onClick={() => setImg(null)} className="text-red-500 text-xs font-black">제거</button>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
              {img && <img src={img} className="w-20 h-20 rounded-xl object-cover border border-zinc-700" alt="" />}

              {user.isAdmin && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isNotice} onChange={e => setIsNotice(e.target.checked)} className="w-5 h-5 accent-yellow-500" />
                  <span className="text-xs font-black text-yellow-500">중요 공지사항으로 등록</span>
                </label>
              )}
            </div>
            <button onClick={handleSave} disabled={isUploading} className="w-full py-5 bg-yellow-500 text-black font-black text-lg rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all">저장 및 게시</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
