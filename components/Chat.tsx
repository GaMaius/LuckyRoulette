
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Message, DEFAULT_PROFILE_IMG } from '../types';
import { api } from '../services/apiService';

interface ChatProps {
  user: User;
  usersRecord: Record<string, User>;
  messages: Message[];
  onSendMessage: (msg: Message) => Promise<void>;
  onUpdateUser: (updatedUser: User) => void;
}

const Chat: React.FC<ChatProps> = ({ user, usersRecord, messages, onSendMessage, onUpdateUser }) => {
  const { targetId } = useParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [chatType, setChatType] = useState<'global' | 'direct'>(targetId ? 'direct' : 'global');
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msg: Message } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatType(targetId ? 'direct' : 'global');
    setReplyTarget(null);
  }, [targetId]);

  useEffect(() => {
    const channelId = chatType === 'global' ? 'global' : (targetId || '');
    if (!channelId) return;
    const now = Date.now();
    if (now - (user.lastRead?.[channelId] || 0) > 1000) {
      onUpdateUser({ ...user, lastRead: { ...(user.lastRead || {}), [channelId]: now } });
    }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, chatType, targetId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: `msg_${Date.now()}_${user.id}`,
      senderId: user.id,
      senderNick: user.nick || user.id,
      senderImg: user.img || DEFAULT_PROFILE_IMG,
      text: inputText,
      timestamp: Date.now(),
      type: chatType,
      targetId: chatType === 'direct' ? targetId : undefined,
      replyTo: replyTarget ? { id: replyTarget.id, senderNick: replyTarget.senderNick, text: replyTarget.text } : undefined
    };
    await onSendMessage(newMessage);
    setInputText('');
    setReplyTarget(null);
  };

  const getUnreadCount = (msg: Message) => {
    const totalUsers = Object.values(usersRecord).filter(u => !u.isAdmin).length;
    const channelId = msg.type === 'global' ? 'global' : msg.senderId;
    const readUsers = Object.values(usersRecord).filter(u => (u.lastRead?.[channelId] || 0) >= msg.timestamp).length;
    const count = totalUsers - readUsers;
    return count > 0 ? count : null;
  };

  const filteredMessages = messages.filter(m => {
    if (chatType === 'global') return m.type === 'global';
    return m.type === 'direct' && ((m.senderId === user.id && m.targetId === targetId) || (m.senderId === targetId && m.targetId === user.id));
  });

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  };

  return (
    <div className="flex flex-col h-full relative" onClick={() => setContextMenu(null)}>
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[1000] bg-zinc-800 border border-zinc-700 shadow-2xl rounded-xl p-1 w-32 animate-fadeIn"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.msg.senderId === user.id ? (
            <button 
              onClick={() => { api.deleteMessage(contextMenu.msg.id); setContextMenu(null); }}
              className="w-full text-left px-4 py-2 text-xs font-black text-red-500 hover:bg-red-500/10 rounded-lg"
            >
              삭제하기
            </button>
          ) : (
            <button 
              onClick={() => { setReplyTarget(contextMenu.msg); setContextMenu(null); }}
              className="w-full text-left px-4 py-2 text-xs font-black text-yellow-500 hover:bg-yellow-500/10 rounded-lg"
            >
              답장하기
            </button>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {filteredMessages.map((m) => {
          const isMe = m.senderId === user.id;
          const unread = getUnreadCount(m);
          return (
            <div key={m.id} onContextMenu={(e) => handleContextMenu(e, m)} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 animate-fadeIn group`}>
              {!isMe && <img src={usersRecord[m.senderId]?.img || m.senderImg} className="w-8 h-8 rounded-full border border-zinc-800 object-cover mt-1" alt="" />}
              <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <span className="text-[9px] font-black text-zinc-500 ml-1 mb-0.5">{m.senderNick}</span>}
                
                {m.replyTo && (
                  <div className={`mb-1 px-3 py-1.5 rounded-xl bg-zinc-800/50 border-l-4 border-yellow-500/50 text-[10px] text-zinc-500 max-w-full truncate ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                    <p className="font-black text-yellow-500/50">@{m.replyTo.senderNick}</p>
                    <p className="truncate italic">{m.replyTo.text}</p>
                  </div>
                )}

                <div className="flex items-end gap-1.5">
                  {isMe && unread && <span className="text-[9px] font-black text-yellow-500 mb-1">{unread}</span>}
                  <div className={`px-4 py-2.5 rounded-[1.25rem] text-[13px] font-bold shadow-md break-all ${isMe ? 'bg-yellow-500 text-black rounded-tr-none' : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700/50'} ${m.isDeleted ? 'opacity-40 italic' : ''}`}>
                    {m.text}
                  </div>
                  {!isMe && unread && <span className="text-[9px] font-black text-yellow-500 mb-1">{unread}</span>}
                </div>
                <span className="text-[7px] text-zinc-700 font-bold uppercase mt-1 px-1">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        {replyTarget && (
          <div className="bg-zinc-800/80 p-3 rounded-t-2xl border-x border-t border-zinc-700 flex justify-between items-center animate-slideUp">
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-yellow-500">@{replyTarget.senderNick} 님에게 답장 중</p>
              <p className="text-[10px] text-zinc-500 truncate">{replyTarget.text}</p>
            </div>
            <button onClick={() => setReplyTarget(null)} className="text-zinc-500"><i className="fas fa-times"></i></button>
          </div>
        )}
        <form onSubmit={handleSend} className={`flex gap-2 p-1 bg-zinc-900 border border-zinc-800 ${replyTarget ? 'rounded-b-2xl border-t-0' : 'rounded-2xl shadow-xl'}`}>
          <input 
            type="text" value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder="보안 메시지를 입력하세요..."
            className="flex-1 bg-transparent px-5 py-4 text-sm font-bold text-white outline-none"
          />
          <button type="submit" className="w-12 h-12 bg-yellow-500 text-black rounded-xl active:scale-90 transition-transform">
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
