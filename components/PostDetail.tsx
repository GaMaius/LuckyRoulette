
import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Post, Comment } from '../types';
import { api } from '../services/apiService';
import { compressImage } from '../services/imageService';

/**
 * 답글 입력을 처리하는 독립 컴포넌트
 */
interface ReplyInputProps {
  placeholder: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

const ReplyInput = memo(({ placeholder, onSubmit, onCancel }: ReplyInputProps) => {
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
        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white outline-none focus:border-yellow-500 shadow-inner"
        autoFocus
      />
      <div className="flex gap-1.5">
        <button type="submit" className="px-4 bg-yellow-500 text-black text-[10px] font-black rounded-xl whitespace-nowrap active:scale-95 transition-transform">
          전송
        </button>
        <button type="button" onClick={onCancel} className="w-10 h-10 flex items-center justify-center text-zinc-500 bg-zinc-800 rounded-xl hover:text-white transition-colors">
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>
    </form>
  );
});

/**
 * 개별 댓글 아이템 컴포넌트
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

const CommentItem = memo(({ 
  comment, depth, user, replyTargetId, setReplyTargetId, onAddReply, onDeleteComment 
}: CommentItemProps) => {
  const isTarget = replyTargetId === comment.id;

  return (
    <div className={`flex flex-col gap-2 ${depth > 0 ? 'ml-6 mt-3 pl-3 border-l-2 border-zinc-800/50' : 'mb-8'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-black text-yellow-500 border border-zinc-700 shadow-sm flex-shrink-0">
            {comment.uploaderNick?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[11px] font-black text-zinc-100 truncate">{comment.uploaderNick}</span>
            <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">
              {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
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
      
      <div className="px-1 overflow-hidden">
        <p className="text-[13px] text-zinc-300 font-medium leading-relaxed break-all whitespace-pre-wrap">
          {comment.text}
        </p>
      </div>
      
      {isTarget && (
        <ReplyInput 
          placeholder={`@${comment.uploaderNick}님에게 답글...`}
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
});

const PostDetail: React.FC<{ user: User; posts: Post[] }> = ({ user, posts }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mainCommentText, setMainCommentText] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);

  // 수정 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImg, setEditImg] = useState<string | null>(null);
  const [isEditNotice, setIsEditNotice] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const post = useMemo(() => posts.find(p => p.id === postId), [posts, postId]);

  const handleOpenEdit = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditImg(post.img || null);
    setIsEditNotice(post.isNotice || false);
    setShowEditModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const base64 = await compressImage(file, 1200, 0.8);
      setEditImg(base64);
    } catch (err) {
      alert('이미지 처리 중 오류 발생');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!post || !editTitle.trim() || !editContent.trim()) return;
    
    const updatedPost: Post = {
      ...post,
      title: editTitle,
      content: editContent,
      img: editImg || undefined,
      isNotice: user.isAdmin ? isEditNotice : (post.isNotice || false)
    };

    await api.savePost(updatedPost);
    alert('수정이 완료되었습니다.');
    setShowEditModal(false);
  };

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
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), newComment] };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: findAndAddReply(c.replies) };
          }
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
    if (!post || !window.confirm('정말 삭제하시겠습니까?')) return;
    
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
      <p>글을 찾을 수 없습니다.</p>
      <button onClick={() => navigate('/feed')} className="mt-6 text-yellow-500 underline text-xs">돌아가기</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-32 max-w-2xl mx-auto overflow-hidden">
      <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 shadow-lg backdrop-blur-sm mx-2">
        <button onClick={() => navigate('/feed')} className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest italic truncate px-2">Post View</span>
        <div className="flex gap-2">
          {(user.isAdmin || user.id === post.uploaderId) && (
            <>
              <button onClick={handleOpenEdit} className="w-10 h-10 rounded-xl bg-zinc-800 text-yellow-500 flex items-center justify-center border border-yellow-500/10 active:scale-90 transition-transform">
                <i className="fas fa-edit text-xs"></i>
              </button>
              <button onClick={handleDeletePost} className="w-10 h-10 rounded-xl bg-red-900/10 text-red-500 flex items-center justify-center border border-red-500/10 active:scale-90 transition-transform">
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/40 rounded-[2.5rem] border border-zinc-800/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden mx-2">
        <div className="flex items-center gap-3 mb-8 overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-black text-yellow-500 border-2 border-zinc-700 shadow-inner flex-shrink-0">
            {post.uploaderNick?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-black text-zinc-100 truncate">{post.uploaderNick}</p>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
              {new Date(post.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white mb-6 italic leading-tight break-all">
          {post.title}
        </h1>
        
        <div className="text-[14px] sm:text-[15px] text-zinc-300 whitespace-pre-wrap leading-relaxed mb-10 break-all min-h-[100px]">
          {post.content}
        </div>

        {post.img && (
          <div className="rounded-3xl overflow-hidden border border-zinc-800 mb-10 shadow-lg">
            <img src={post.img} alt="" className="w-full h-auto object-cover max-h-[600px]" />
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-full mb-10"></div>

        <div className="flex flex-col">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-2">
            <i className="fas fa-comments text-yellow-500"></i> COMMENTS ({post.comments?.length || 0})
          </h3>

          <div className="flex flex-col overflow-hidden">
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
              <div className="py-16 text-center border-2 border-dashed border-zinc-800/30 rounded-3xl">
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">의견을 남겨주세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!replyTargetId && (
        <div className="fixed bottom-24 left-0 right-0 z-[100] px-4 flex justify-center animate-fadeIn max-w-2xl mx-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAddComment(); }}
            className="w-full bg-zinc-900/95 backdrop-blur-xl border border-yellow-500/20 rounded-[2rem] p-1.5 flex gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
          >
            <input 
              type="text" 
              value={mainCommentText} 
              onChange={e => setMainCommentText(e.target.value)}
              placeholder="댓글 남기기..."
              className="flex-1 bg-transparent px-6 py-4 text-sm font-bold text-white outline-none min-w-0"
            />
            <button 
              type="submit"
              className="w-14 h-14 bg-yellow-500 text-black rounded-[1.5rem] flex items-center justify-center active:scale-90 transition-all shadow-lg flex-shrink-0"
            >
              <i className="fas fa-paper-plane text-xl"></i>
            </button>
          </form>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 flex flex-col gap-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black italic text-yellow-400 uppercase">게시글 수정</h2>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500"><i className="fas fa-times text-xl"></i></button>
            </div>
            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="제목" className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-yellow-500" />
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="내용" className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-yellow-500 min-h-[200px] resize-none" />
            <div className="flex items-center gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-zinc-800 rounded-xl text-[10px] font-black text-zinc-400 flex items-center gap-2">
                <i className="fas fa-image"></i> {editImg ? '사진 변경' : '사진 추가'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              {user.isAdmin && <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isEditNotice} onChange={e => setIsEditNotice(e.target.checked)} className="accent-yellow-500" /><span className="text-[10px] font-black text-yellow-500">공지 설정</span></label>}
            </div>
            {editImg && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-zinc-800">
                <img src={editImg} className="w-full h-full object-cover" alt="Preview" />
                <button onClick={() => setEditImg(null)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full text-[10px]"><i className="fas fa-times"></i></button>
              </div>
            )}
            <button onClick={handleUpdatePost} disabled={isUploading} className="w-full py-5 bg-yellow-500 text-black font-black rounded-2xl shadow-xl active:scale-95 transition-all">
              수정 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
