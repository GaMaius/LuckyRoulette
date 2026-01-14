
import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Post, Comment } from '../types';
import { api } from '../services/apiService';

/**
 * 답글 입력을 처리하는 독립 컴포넌트
 * 부모 리렌더링과 독립되어 한글 입력(IME) 오류를 방지합니다.
 */
interface ReplyInputProps {
  placeholder: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

const ReplyInput: React.FC<ReplyInputProps> = ({ placeholder, onSubmit, onCancel }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2 animate-slideUp">
      <input 
        type="text" 
        value={text} 
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-yellow-500 shadow-inner"
      />
      <button type="submit" className="px-4 bg-yellow-500 text-black text-[10px] font-black rounded-xl whitespace-nowrap active:scale-95 transition-transform">
        전송
      </button>
      <button type="button" onClick={onCancel} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
        <i className="fas fa-times text-xs"></i>
      </button>
    </form>
  );
};

/**
 * 개별 댓글 아이템 컴포넌트 (외부 정의로 포커스 유실 방지)
 */
interface CommentItemProps {
  comment: Comment;
  depth: number;
  user: User;
  replyTargetId: string | null;
  setReplyTargetId: (id: string | null) => void;
  onAddReply: (parentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, depth, user, replyTargetId, setReplyTargetId, onAddReply, onDeleteComment 
}) => {
  const isTarget = replyTargetId === comment.id;

  return (
    <div className={`flex flex-col gap-2 ${depth > 0 ? 'ml-6 mt-3 pl-3 border-l-2 border-zinc-800/50' : 'mb-8'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-black text-yellow-500 border border-zinc-700 shadow-sm">
            {comment.uploaderNick[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-zinc-100">{comment.uploaderNick}</span>
            <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">
              {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setReplyTargetId(isTarget ? null : comment.id)} 
            className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isTarget ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {isTarget ? '취소' : '답글'}
          </button>
          {(user.isAdmin || user.id === comment.uploaderId) && (
            <button 
              onClick={() => onDeleteComment(comment.id)} 
              className="text-[9px] font-black text-red-900 hover:text-red-500 uppercase tracking-widest transition-colors"
            >
              삭제
            </button>
          )}
        </div>
      </div>
      
      <div className="px-1">
        <p className="text-[13px] text-zinc-300 font-medium leading-relaxed break-all whitespace-pre-wrap">
          {comment.text}
        </p>
      </div>
      
      {isTarget && (
        <ReplyInput 
          placeholder={`@${comment.uploaderNick}님에게 답글 남기기...`}
          onSubmit={(text) => onAddReply(comment.id, text)}
          onCancel={() => setReplyTargetId(null)}
        />
      )}

      {comment.replies?.map(reply => (
        <CommentItem 
          key={reply.id} 
          comment={reply} 
          depth={depth + 1} 
          user={user}
          replyTargetId={replyTargetId}
          setReplyTargetId={setReplyTargetId}
          onAddReply={onAddReply}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </div>
  );
};

const PostDetail: React.FC<{ user: User; posts: Post[] }> = ({ user, posts }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [mainCommentText, setMainCommentText] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);

  const post = useMemo(() => posts.find(p => p.id === postId), [posts, postId]);

  const handleAddComment = useCallback(async (parentId?: string, text?: string) => {
    const finalContent = text || mainCommentText;
    if (!finalContent.trim() || !post) return;
    
    const newComment: Comment = {
      id: `comment_${Date.now()}_${user.id}`,
      uploaderId: user.id,
      uploaderNick: user.nick,
      text: finalContent,
      timestamp: Date.now(),
      replies: []
    };

    let updatedComments = [...(post.comments || [])];

    if (parentId) {
      const findAndAddReply = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.id === parentId) return { ...c, replies: [...(c.replies || []), newComment] };
          if (c.replies && c.replies.length > 0) return { ...c, replies: findAndAddReply(c.replies) };
          return c;
        });
      };
      updatedComments = findAndAddReply(updatedComments);
    } else {
      updatedComments.push(newComment);
    }

    await api.savePost({ ...post, comments: updatedComments });
    if (!parentId) setMainCommentText('');
    setReplyTargetId(null);
  }, [mainCommentText, post, user]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!post || !window.confirm('정말 이 댓글(및 하위 답글)을 삭제하시겠습니까?')) return;
    
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
  }, [post]);

  const handleDeletePost = useCallback(async () => {
    if (!post || !window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    await api.deletePost(post.id);
    navigate('/feed');
  }, [post, navigate]);

  if (!post) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500 font-black animate-fadeIn">
      <i className="fas fa-exclamation-triangle text-4xl mb-4 text-zinc-800"></i>
      <p>글을 찾을 수 없거나 이미 삭제되었습니다.</p>
      <button onClick={() => navigate('/feed')} className="mt-6 text-yellow-500 underline text-xs">게시판으로 돌아가기</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-32 max-w-2xl mx-auto">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 shadow-lg backdrop-blur-sm">
        <button onClick={() => navigate('/feed')} className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-90 transition-transform hover:text-white">
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] italic">Post Detail</span>
        {(user.isAdmin || user.id === post.uploaderId) ? (
          <button onClick={handleDeletePost} className="w-10 h-10 rounded-xl bg-red-900/10 text-red-900 hover:bg-red-600 hover:text-white flex items-center justify-center active:scale-90 transition-all border border-red-900/20">
            <i className="fas fa-trash-alt text-xs"></i>
          </button>
        ) : <div className="w-10"></div>}
      </div>

      {/* 게시글 본문 */}
      <div className="bg-zinc-900/40 rounded-[2.5rem] border border-zinc-800/80 p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-black text-yellow-500 border-2 border-zinc-700 shadow-inner">
            {post.uploaderNick[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black text-zinc-100">{post.uploaderNick}</p>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
              {new Date(post.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-6 italic leading-tight break-all">
          {post.title}
        </h1>
        
        <div className="text-[15px] text-zinc-300 whitespace-pre-wrap leading-relaxed mb-10 break-all min-h-[100px]">
          {post.content}
        </div>

        {post.img && (
          <div className="rounded-3xl overflow-hidden border border-zinc-800 mb-10 shadow-lg">
            <img src={post.img} alt="" className="w-full h-auto object-cover max-h-[600px]" />
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-full mb-10"></div>

        {/* 댓글 섹션 */}
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] mb-8 flex items-center gap-2">
            <i className="fas fa-comments text-yellow-500"></i> FEEDBACK ({post.comments?.length || 0})
          </h3>

          <div className="flex flex-col">
            {post.comments?.map(c => (
              <CommentItem 
                key={c.id} 
                comment={c} 
                depth={0} 
                user={user}
                replyTargetId={replyTargetId}
                setReplyTargetId={setReplyTargetId}
                onAddReply={(pid, txt) => handleAddComment(pid, txt)}
                onDeleteComment={handleDeleteComment}
              />
            ))}
            {(!post.comments || post.comments.length === 0) && (
              <div className="py-16 text-center border-2 border-dashed border-zinc-800/50 rounded-3xl">
                <i className="fas fa-comment-slash text-zinc-800 text-3xl mb-4"></i>
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">첫 번째 의견을 남겨주세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 댓글 입력 고정 바 */}
      {!replyTargetId && (
        <div className="fixed bottom-24 left-0 right-0 z-[100] px-4 flex justify-center animate-fadeIn">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAddComment(); }}
            className="w-full max-w-lg bg-zinc-900/95 backdrop-blur-xl border border-yellow-500/20 rounded-[2rem] p-1.5 flex gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
          >
            <input 
              type="text" 
              value={mainCommentText} 
              onChange={e => setMainCommentText(e.target.value)}
              placeholder="게시글에 댓글 남기기..."
              className="flex-1 bg-transparent px-6 py-4 text-sm font-bold text-white outline-none"
            />
            <button 
              type="submit"
              className="w-14 bg-yellow-500 text-black rounded-[1.5rem] flex items-center justify-center active:scale-90 transition-all shadow-lg"
            >
              <i className="fas fa-paper-plane text-xl"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
