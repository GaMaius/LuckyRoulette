
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Message, DEFAULT_PROFILE_IMG } from '../types';

interface ChatProps {
  user: User;
  usersRecord: Record<string, User>;
  messages: Message[];
  onSendMessage: (msg: Message) => void;
  onUpdateUser: (updatedUser: User) => void;
}

const Chat: React.FC<ChatProps> = ({ user, usersRecord, messages, onSendMessage, onUpdateUser }) => {
  const { targetId } = useParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [chatType, setChatType] = useState<'global' | 'direct'>(targetId ? 'direct' : 'global');
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

    // 0.5초 이상 차이날 때만 업데이트 (과도한 갱신 방지)
    if (now - currentReadTime > 500) {
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
  }, [messages, chatType, targetId]);

  const handleSend = (e: React.FormEvent) => {
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
    };

    onSendMessage(newMessage);
    setInputText('');
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

  // 특정 대화방의 안읽은 개수 계산 헬퍼
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
          <div className="flex bg-zinc-800 p-1 rounded-xl">
            <button 
              onClick={() => setChatType('global')}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${chatType === 'global' ? 'bg-yellow-500 text-black' : 'text-zinc-500'}`}
            >
              글로벌 광장
            </button>
            <button 
              onClick={() => setChatType('direct')}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${chatType === 'direct' ? 'bg-yellow-500 text-black' : 'text-zinc-500'}`}
            >
              개인 메시지
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-2xl border border-zinc-700/50">
            <button onClick={() => navigate('/chat')} className="text-zinc-400">
              <i className="fas fa-arrow-left"></i>
            </button>
            <img src={targetUser?.img || DEFAULT_PROFILE_IMG} className="w-8 h-8 rounded-full object-cover border border-yellow-500/50" alt="" />
            <div>
              <p className="text-xs font-black text-white">{targetUser?.nick || targetId}</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
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
              className="flex items-center gap-4 bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/20 hover:bg-yellow-500/20 transition-all cursor-pointer mb-2 relative"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black shadow-lg">
                <i className="fas fa-headset"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-yellow-500">운영지원팀 (고객센터)</p>
                <p className="text-[10px] text-zinc-400">문의 사항은 여기에 남겨주세요.</p>
              </div>
              {getUnreadCount('admin') > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full mr-2">
                  {getUnreadCount('admin')}
                </span>
              )}
              <i className="fas fa-chevron-right text-yellow-500 text-xs"></i>
            </div>
          )}

          {(Object.values(usersRecord) as User[]).filter(u => u.id !== user.id && !u.isAdmin).map(u => {
            const count = getUnreadCount(u.id);
            return (
              <div 
                key={u.id}
                onClick={() => navigate(`/chat/${u.id}`)}
                className="flex items-center gap-4 bg-zinc-800/30 p-4 rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-all cursor-pointer relative"
              >
                <img src={u.img || DEFAULT_PROFILE_IMG} className="w-10 h-10 rounded-full object-cover border border-zinc-700 shadow-md" alt="" />
                <div className="flex-1">
                  <p className="text-sm font-black text-white">{u.nick || u.id}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{u.bio || '메시지를 보내보세요'}</p>
                </div>
                {count > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full mr-2">
                    {count}
                  </span>
                )}
                <i className="fas fa-chevron-right text-zinc-700 text-xs"></i>
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
                <i className="fas fa-comment-dots text-4xl mb-2 opacity-20"></i>
                <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                  대화 내용이 없습니다
                </p>
              </div>
            )}
            {filteredMessages.map((m) => {
              const isMe = m.senderId === user.id;
              const isSenderAdmin = m.senderId === 'admin';
              const currentSender = isSenderAdmin ? { id: 'admin', nick: '운영지원팀', img: 'https://picsum.photos/seed/admin/200/200', lastRead: {} } : (usersRecord[m.senderId] || null);
              const displayImg = currentSender?.img || m.senderImg || DEFAULT_PROFILE_IMG;
              const displayNick = currentSender?.nick || m.senderNick || m.senderId;
              
              // 상대방이 읽었는지 확인 (1:1 채팅일 때만)
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
                      className={`w-8 h-8 rounded-full border border-zinc-700 object-cover mt-1 ${isSenderAdmin ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : ''}`} 
                      alt="" 
                      onClick={() => !isSenderAdmin && navigate(`/profile/${m.senderId}`)}
                    />
                  )}
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5 relative`}>
                    {!isMe && chatType === 'global' && (
                      <span className={`text-[9px] font-black ml-1 ${isSenderAdmin ? 'text-yellow-500' : 'text-zinc-500'}`}>
                        {displayNick} {isSenderAdmin && '🛡️'}
                      </span>
                    )}
                    <div className="flex items-end gap-1.5">
                      {isMe && showOne && (
                        <span className="text-[10px] font-black text-yellow-500 mb-1">1</span>
                      )}
                      <div className={`px-4 py-2 rounded-2xl text-sm font-medium shadow-sm ${
                        isMe ? 'bg-yellow-500 text-black rounded-tr-none' : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700/50'
                      }`}>
                        {m.text}
                      </div>
                      {!isMe && (
                        <span className="text-[7px] text-zinc-600 font-bold uppercase self-end mb-1">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {isMe && (
                      <span className="text-[7px] text-zinc-600 font-bold uppercase px-1">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="mt-4 flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="메시지 입력..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-sm font-bold text-white focus:outline-none focus:border-yellow-500"
            />
            <button type="submit" className="w-12 h-12 bg-yellow-500 text-black rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;
