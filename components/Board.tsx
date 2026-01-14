
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
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
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
      alert('Error processing image');
    } finally {
      setIsUploading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPostId(null);
    setTitle('');
    setContent('');
    setImg(null);
    setIsNotice(false);
    setShowModal(true);
  };

  const openEditModal = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    setEditingPostId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setImg(post.img || null);
    setIsNotice(post.isNotice || false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return alert('Title and content are required.');
    
    if (editingPostId) {
      const originalPost = posts.find(p => p.id === editingPostId);
      if (!originalPost) return;
      const updatedPost: Post = {
        ...originalPost,
        title, content, img: img || undefined,
        isNotice: user.isAdmin ? isNotice : (originalPost.isNotice || false)
      };
      await api.savePost(updatedPost);
    } else {
      const post: Post = {
        id: `post_${Date.now()}_${user.id}`,
        title, content, img: img || undefined,
        uploaderId: user.id, uploaderNick: user.nick,
        timestamp: Date.now(), isNotice: user.isAdmin ? isNotice : false,
        comments: []
      };
      await api.savePost(post);
    }
    
    setShowModal(false);
    setEditingPostId(null);
    setTitle(''); setContent(''); setImg(null);
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this post permanently?')) return;
    await api.deletePost(postId);
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Feed Header */}
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between shadow-2xl">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black italic tracking-tighter text-amber-500 drop-shadow-sm">COMMUNITY</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
            GLOBAL NETWORK FEED
          </p>
        </div>
        <button onClick={openCreateModal} className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-zinc-950 shadow-xl shadow-amber-500/20 active:scale-90 transition-all hover:scale-105">
          <i className="fas fa-plus-circle text-2xl"></i>
        </button>
      </div>

      {/* Feed List */}
      <div className="flex flex-col gap-4">
        {sortedPosts.map((post) => (
          <div key={post.id} onClick={() => navigate(`/feed/${post.id}`)} 
               className={`group p-6 rounded-[2rem] border transition-all cursor-pointer hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-[0.98] relative overflow-hidden ${post.isNotice ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-900/40 border-white/5 hover:border-zinc-700/50'}`}>
            
            {post.isNotice && (
              <div className="absolute top-0 right-0 p-1.5 px-3 bg-amber-500 text-black text-[8px] font-black uppercase rounded-bl-xl tracking-widest z-10">NOTICE</div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-amber-500 border border-white/5">
                {post.uploaderNick?.[0]?.toUpperCase()}
              </div>
              <span className="text-[10px] text-zinc-400 font-black tracking-tight">{post.uploaderNick}</span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
              <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{new Date(post.timestamp).toLocaleDateString()}</span>
            </div>

            <h3 className={`text-lg font-black mb-2 transition-colors ${post.isNotice ? 'text-amber-400' : 'text-zinc-100 group-hover:text-amber-400'}`}>
              {post.title}
            </h3>

            <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-6 font-medium">
              {post.content}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-4 text-zinc-500 text-[11px] font-black">
                <span className="flex items-center gap-1.5"><i className="far fa-comment-dots"></i> {post.comments?.length || 0}</span>
                {post.img && <span className="flex items-center gap-1.5"><i className="far fa-image"></i> ATTACHED</span>}
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {(user.isAdmin || user.id === post.uploaderId) && (
                  <>
                    <button 
                      onClick={(e) => openEditModal(e, post)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-500 hover:text-amber-500 transition-all flex items-center justify-center"
                    >
                      <i className="fas fa-pen text-[10px]"></i>
                    </button>
                    <button 
                      onClick={(e) => handleDeletePost(e, post.id)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-500 hover:text-rose-500 transition-all flex items-center justify-center"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {posts.length === 0 && (
          <div className="py-24 text-center glass rounded-[2.5rem] border border-dashed border-white/10">
            <i className="fas fa-inbox text-4xl text-zinc-800 mb-4"></i>
            <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px]">No transmission found in this sector</p>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-lg glass border border-white/10 rounded-[3rem] p-10 flex flex-col gap-6 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black italic text-amber-500 uppercase tracking-tighter">{editingPostId ? 'Edit Post' : 'Create Feed'}</h2>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Post Title" 
              className="w-full bg-black/40 border-2 border-zinc-800 rounded-2xl py-4 px-6 font-black text-white outline-none focus:border-amber-500/50 transition-all" 
            />
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Share your thoughts..." 
              className="w-full bg-black/40 border-2 border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-amber-500/50 min-h-[180px] resize-none transition-all custom-scrollbar" 
            />
            <div className="flex items-center gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="px-5 py-2.5 bg-zinc-800 rounded-xl text-[10px] font-black text-zinc-400 flex items-center gap-2 border border-white/5 active:scale-95 transition-transform"
              >
                <i className="fas fa-image text-amber-500"></i> {img ? 'CHANGE MEDIA' : 'ADD MEDIA'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              {user.isAdmin && (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={isNotice} onChange={e => setIsNotice(e.target.checked)} className="hidden" />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isNotice ? 'bg-amber-500 border-amber-500' : 'border-zinc-700 bg-zinc-800'}`}>
                    {isNotice && <i className="fas fa-check text-[10px] text-black"></i>}
                  </div>
                  <span className={`text-[10px] font-black transition-colors ${isNotice ? 'text-amber-500' : 'text-zinc-500 group-hover:text-zinc-400'}`}>PRIORITY NOTICE</span>
                </label>
              )}
            </div>
            {img && (
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-xl group">
                <img src={img} className="w-full h-full object-cover" alt="Preview" />
                <button onClick={() => setImg(null)} className="absolute top-2 right-2 w-7 h-7 bg-rose-600 text-white rounded-lg text-[10px] flex items-center justify-center shadow-lg"><i className="fas fa-times"></i></button>
              </div>
            )}
            <button 
              onClick={handleSave} 
              disabled={isUploading} 
              className="w-full py-5 bg-amber-500 text-zinc-950 font-black rounded-[1.5rem] shadow-2xl active:scale-95 transition-all text-lg tracking-tight gold-glow uppercase italic"
            >
              {isUploading ? 'SYNCHRONIZING...' : editingPostId ? 'COMPLETE UPDATE' : 'PUBLISH TO GLOBAL'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
