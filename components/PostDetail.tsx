
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Post, Comment } from '../types';
import { api } from '../services/apiService';

interface PostDetailProps {
  user: User;
  posts: Post[];
}

const PostDetail: React.FC<PostDetailProps> = ({ user, posts }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);

  const post = useMemo(() => posts.find(p => p.id === postId), [posts, postId]);

  if (!post) return <div className="p-10 text-center text-zinc-500 font-black">글을 찾을 수 없습니다.</div>;

  const handleAddComment = async (parentId?: string) => {
    if (!commentText.trim()) return;
    
    const newComment: Comment = {
      id: `comment_${Date.now()}_${user.id}`,
      uploaderId: user.id,
      uploaderNick: user.nick,
      text: commentText,
      timestamp: Date.now(),
      replies: []
    };

    let updatedComments = [...(post.comments || [])];

    if (parentId) {
      const addReply = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.id === parentId) return { ...c, replies: [...(c.replies || []), newComment] };
          if (c.replies) return { ...c, replies: addReply(c.replies) };
          return c;
        });
      };
      updatedComments = addReply(updatedComments);
    } else {
      updatedComments.push(newComment);
    }

    await api.savePost({ ...post, comments: updatedComments });
    setCommentText('');
    setReplyTarget(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('정말 이 댓글(및 답글)을 삭제하시겠습니까?')) return;
    
    const filterComments = (comments: Comment[]): Comment[] => {
      return comments
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: c.replies ? filterComments(c.replies) : []
        }));
    };

    const nextComments = filterComments(post.comments || []);
    await api.savePost({ ...post, comments: nextComments });
  };

  const handleDeletePost = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    await api.deletePost(post.id);
    navigate('/feed');
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment, depth?: number }) => (
    <div className={`flex flex-col gap-2 ${depth > 0 ? 'ml-6 mt-2 pl-3 border-l border-zinc-800' : 'mb-6'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-yellow-500">
            {comment.uploaderNick[0]}
          </div>
          <span className="text-[11px] font-black text-white">{comment.uploaderNick}</span>
          <span className="text-[8px] text-zinc-600 font-bold uppercase">{new Date(comment.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setReplyTarget(comment.id); setCommentText(''); }} className="text-[8px] font-black text-zinc-500 hover:text-yellow-500 uppercase tracking-widest">답글</button>
          {(user.isAdmin || user.id === comment.uploaderId) && (
            <button onClick={() => handleDeleteComment(comment.id)} className="text-[8px] font-black text-red-900 hover:text-red-500 uppercase tracking-widest">삭제</button>
          )}
        </div>
      </div>
      <p className="text-xs text-zinc-300 font-medium leading-relaxed px-1 break-all">{comment.text}</p>
      
      {replyTarget === comment.id && (
        <div className="mt-3 flex gap-2 animate-slideUp">
          <input 
            type="text" value={commentText} 
            onChange={e => setCommentText(e.target.value)}
            // IME 분리 방지를 위해 autoFocus를 조심스럽게 사용하거나 제거
            placeholder={`@${comment.uploaderNick} 답글...`}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-yellow-500"
          />
          <button onClick={() => handleAddComment(comment.id)} className="px-4 bg-yellow-500 text-black text-[10px] font-black rounded-xl whitespace-nowrap">전송</button>
          <button onClick={() => setReplyTarget(null)} className="text-zinc-500 text-[10px]"><i className="fas fa-times"></i></button>
        </div>
      )}

      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-32">
      <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <button onClick={() => navigate('/feed')} className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="text-xs font-black text-yellow-500 uppercase tracking-widest italic">Viewing Post</span>
        {(user.isAdmin || user.id === post.uploaderId) ? (
          <button onClick={handleDeletePost} className="w-10 h-10 rounded-xl bg-red-900/10 text-red-500 flex items-center justify-center active:scale-90 transition-transform">
            <i className="fas fa-trash-alt"></i>
          </button>
        ) : <div className="w-10"></div>}
      </div>

      <div className="bg-zinc-900/30 rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-black text-yellow-500 shadow-inner">
            {post.uploaderNick[0]}
          </div>
          <div>
            <p className="text-sm font-black text-white">{post.uploaderNick}</p>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(post.timestamp).toLocaleString()}</p>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-4 italic leading-tight break-all">{post.title}</h1>
        <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed mb-8 break-all">{post.content}</p>

        {post.img && (
          <div className="rounded-3xl overflow-hidden border border-zinc-800 mb-8">
            <img src={post.img} alt="" className="w-full h-auto object-cover" />
          </div>
        )}

        <div className="h-px bg-zinc-800/50 w-full mb-8"></div>

        <div className="flex flex-col">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <i className="fas fa-comments text-yellow-500"></i> FEEDBACK ({post.comments?.length || 0})
          </h3>

          <div className="space-y-2">
            {post.comments?.map(c => <CommentItem key={c.id} comment={c} />)}
            {(!post.comments || post.comments.length === 0) && (
              <div className="py-10 text-center opacity-20">
                <p className="text-[10px] font-black uppercase">첫 댓글을 남겨보세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!replyTarget && (
        <div className="fixed bottom-24 left-0 right-0 z-[100] px-4 flex justify-center">
          <div className="w-full max-w-lg bg-zinc-900/90 backdrop-blur-xl border border-yellow-500/20 rounded-[2rem] p-2 flex gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <input 
              type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="게시글에 댓글 남기기..."
              className="flex-1 bg-transparent px-5 py-4 text-xs font-bold text-white outline-none"
            />
            <button 
              onClick={() => handleAddComment()}
              className="w-14 bg-yellow-500 text-black rounded-[1.5rem] flex items-center justify-center active:scale-95 transition-transform"
            >
              <i className="fas fa-paper-plane text-lg"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
