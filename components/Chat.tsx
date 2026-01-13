
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Message, DEFAULT_PROFILE_IMG } from '../types';

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
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetId) setChatType('direct');
    else setChatType('global');
  }, [targetId]);

  // 방에 입장하거나 새 메시지가 올 때 lastRead 업데이트
  useEffect(() => {
    const channelId = chatType === 'global' ? 'global' : (targetId || '');
    if (!channelId) return;

    const currentReadTime = (user.lastRead || {})[channelId] || 0;
    const now = Date.now();

    // 1초 이상 차이날 때만 업데이트 (과도한 저장 방지)
    if (now - currentReadTime > 1000) {
      const updatedUser = {
        ...user,
        lastRead: {
          ...(user.lastRead || {}),
          [channelId]: now
        }
      };
      onUpdateUser(updatedUser);
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, chatType, targetId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const newMessage: Message = {
      id: `msg_${Date.now()}_${user.id}_${Math.random().toString(36).substr(2, 5)}`,
      senderId: user.id,
      senderNick: user.nick || user.id,
      senderImg: user.img || DEFAULT_PROFILE_IMG,
      text: inputText,
      timestamp: Date.now(),
      type: chatType,
      targetId: chatType === 'direct' ? targetId : undefined,
    };

    try {
      await onSendMessage(newMessage);
      setInputText('');
    } catch (err) {
      alert('메시지 전송에 실패했습니다. 연결 상태를 확인하세요.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (chatType === 'global') return m.type === 'global';
    if (!targetId) return false;
    return m.type === 'direct' && (
      (m.senderId === user.id && m.targetId === targetId) ||
      (m.senderId === targetId && m.targetId === user.id)
    );
  });

  const targetUser = targetId ? (usersRecord[targetId] || (targetId === 'admin' ? { id: 'admin', nick: '운영지원팀', img: 'https://picsum.photos/seed/admin/200/200' } : null)) : null;

  const getUnreadCount = (partnerId: string) => {
    const lastRead = (user.lastRead || {})[partnerId] || 0;
    return messages.filter(m => 
      m.type === 'direct' && 
      m.senderId === partnerId && 
      m.targetId === user.id && 
      m.timestamp > lastRead
    ).length;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-fadeIn">
      <div className="flex flex-col gap-3 mb-4">
        {!targetId ? (
          <div className="flex bg-zinc-800 p-1 rounded-xl shadow-inner">
            <button 
              onClick={() => setChatType('global')}
              className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${chatType === 'global' ? 'bg-yellow-500 text-black shadow-md' : 'text-zinc-500'}`}
            >
              글로벌 광장
            </button>
            <button 
              onClick={() => setChatType('direct')}
              className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${chatType === 'direct' ? 'bg-yellow-500 text-black shadow-md' : 'text-zinc-500'}`}
            >
              개인 메시지
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-2xl border border-zinc-700/50">
            <button onClick={() => navigate('/chat')} className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
              <i className="fas fa-arrow-left text-xs"></i>
            </button>
            <img src={targetUser?.img || DEFAULT_PROFILE_IMG} className="w-9 h-9 rounded-full object-cover border border-yellow-500/50 shadow-lg" alt="" />
            <div>
              <p className="text-sm font-black text-white leading-tight">{targetUser?.nick || targetId}</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                {targetId === 'admin' ? '고객센터 문의' : '보안 1:1 대화'}
              </p>
            </div>
          </div>
        )}
      </div>

      {chatType === 'direct' && !targetId && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {!user.isAdmin && (
            <div 
              onClick={() => navigate(`/chat/admin`)}
              className="flex items-center gap-4 bg-yellow-500/10 p-4 rounded-3xl border border-yellow-500/20 hover:bg-yellow-500/20 transition-all cursor-pointer mb-2 relative group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-yellow-500 flex items-center justify-center text-black shadow-lg transform group-hover:rotate-12 transition-transform">
                <i className="fas fa-headset text-xl"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-yellow-500 uppercase tracking-tighter">운영지원팀 (고객센터)</p>
                <p className="text-[10px] text-zinc-500 font-bold">도움이 필요하시면 말씀해주세요</p>
              </div>
              {getUnreadCount('admin') > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full mr-2 shadow-lg animate-pulse">
                  {getUnreadCount('admin')}
                </span>
              )}
              <i className="fas fa-chevron-right text-yellow-500/30 text-xs"></i>
            </div>
          )}

          {(Object.values(usersRecord) as User[]).filter(u => u.id !== user.id && !u.isAdmin).map(u => {
            const count = getUnreadCount(u.id);
            return (
              <div 
                key={u.id}
                onClick={() => navigate(`/chat/${u.id}`)}
                className="flex items-center gap-4 bg-zinc-800/30 p-4 rounded-3xl border border-zinc-800 hover:bg-zinc-800 transition-all cursor-pointer relative group"
              >
                <img src={u.img || DEFAULT_PROFILE_IMG} className="w-12 h-12 rounded-full object-cover border border-zinc-700 shadow-md transition-transform group-hover:scale-105" alt="" />
                <div className="flex-1">
                  <p className="text-sm font-black text-white">{u.nick || u.id}</p>
                  <p className="text-[10px] text-zinc-500 truncate font-medium">{u.bio || '새로운 보안 대화를 시작하세요'}</p>
                </div>
                {count > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full mr-2 shadow-lg">
                    {count}
                  </span>
                )}
                <i className="fas fa-chevron-right text-zinc-700 text-xs transition-transform group-hover:translate-x-1"></i>
              </div>
            );
          })}
        </div>
      )}

      {(chatType === 'global' || (chatType === 'direct' && targetId)) && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {filteredMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-700 text-center px-6">
                <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 border border-zinc-700/30">
                  <i className="fas fa-comment-dots text-3xl opacity-20"></i>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] leading-relaxed opacity-40">
                  보안 네트워크 대기 중...
                </p>
              </div>
            )}
            {filteredMessages.map((m) => {
              const isMe = m.senderId === user.id;
              const isSenderAdmin = m.senderId === 'admin';
              const currentSender = isSenderAdmin ? { id: 'admin', nick: '운영지원팀', img: 'https://picsum.photos/seed/admin/200/200' } : (usersRecord[m.senderId] || null);
              const displayImg = currentSender?.img || m.senderImg || DEFAULT_PROFILE_IMG;
              const displayNick = currentSender?.nick || m.senderNick || m.senderId;
              
              let showOne = false;
              if (isMe && chatType === 'direct' && targetId) {
                const partner = usersRecord[targetId] || (targetId === 'admin' ? { lastRead: {} } : null);
                const partnerReadTime = (partner?.lastRead || {})[user.id] || 0;
                if (m.timestamp > partnerReadTime) {
                  showOne = true;
                }
              }

              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 animate-fadeIn`}>
                  {!isMe && (
                    <img 
                      src={displayImg} 
                      className={`w-9 h-9 rounded-full border border-zinc-700 object-cover mt-1 shadow-md ${isSenderAdmin ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : ''}`} 
                      alt="" 
                      onClick={() => !isSenderAdmin && navigate(`/profile/${m.senderId}`)}
                    />
                  )}
                  <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5 relative`}>
                    {!isMe && chatType === 'global' && (
                      <span className={`text-[9px] font-black ml-1 uppercase tracking-tighter ${isSenderAdmin ? 'text-yellow-500' : 'text-zinc-500'}`}>
                        {displayNick} {isSenderAdmin && '🛡️'}
                      </span>
                    )}
                    <div className="flex items-end gap-1.5">
                      {isMe && showOne && (
                        <span className="text-[10px] font-black text-yellow-500 mb-1 animate-pulse">1</span>
                      )}
                      <div className={`px-4 py-2.5 rounded-[1.25rem] text-[13px] font-bold shadow-md break-all leading-relaxed ${
                        isMe ? 'bg-yellow-500 text-black rounded-tr-none' : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700/50'
                      }`}>
                        {m.text}
                      </div>
                      {!isMe && (
                        <span className="text-[7px] text-zinc-600 font-bold uppercase self-end mb-1 tabular-nums">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {isMe && (
                      <span className="text-[7px] text-zinc-600 font-bold uppercase px-1 tabular-nums">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="mt-4 flex gap-2 relative">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              placeholder={isSending ? "보안 전송 중..." : "메시지 입력..."}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-600"
            />
            <button 
              type="submit" 
              disabled={isSending || !inputText.trim()}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all ${
                isSending || !inputText.trim() ? 'bg-zinc-700 text-zinc-500' : 'bg-yellow-500 text-black'
              }`}
            >
              {isSending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;
