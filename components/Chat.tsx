import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msg: Message } | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const chatType = targetId ? 'direct' : 'global';
  const currentChannelId = chatType === 'global' ? 'global' : targetId!;

  useEffect(() => {
    const now = Date.now();
    if (now - (user.lastRead?.[currentChannelId] || 0) > 1000) {
      onUpdateUser({ ...user, lastRead: { ...(user.lastRead || {}), [currentChannelId]: now } });
    }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, currentChannelId]);

  const scrollToMessage = (msgId: string) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  };

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

  // 카카오톡 스타일 안읽은 사람 수 계산 (글로벌용)
  const getGlobalUnreadCount = (msg: Message) => {
    const allActiveUsers = Object.values(usersRecord);
    const unreadUsers = allActiveUsers.filter(u => (u.lastRead?.['global'] || 0) < msg.timestamp);
    return unreadUsers.length > 0 ? unreadUsers.length : null;
  };

  // 1:1 채팅 읽음 확인 (1 표시)
  const getDMUnread = (msg: Message) => {
    if (msg.senderId !== user.id) return null; // 내가 보낸 것만 확인
    const targetUser = usersRecord[targetId!];
    if (!targetUser) return null;
    const hasRead = (targetUser.lastRead?.[user.id] || 0) >= msg.timestamp;
    return hasRead ? null : 1;
  };

  const filteredMessages = messages.filter(m => {
    if (chatType === 'global') return m.type === 'global';
    return m.type === 'direct' && ((m.senderId === user.id && m.targetId === targetId) || (m.senderId === targetId && m.targetId === user.id));
  });

  const SidebarItem = ({ id, label, img, isGlobal }: { id: string, label: string, img?: string, isGlobal?: boolean }) => {
    const isActive = isGlobal ? !targetId : targetId === id;
    const lastRead = user.lastRead?.[isGlobal ? 'global' : id] || 0;
    const unread = messages.filter(m => {
      const mChannel = m.type === 'global' ? 'global' : (m.senderId === user.id ? m.targetId : m.senderId);
      return mChannel === (isGlobal ? 'global' : id) && m.senderId !== user.id && m.timestamp > lastRead;
    }).length;

    return (
      <div onClick={() => { navigate(isGlobal ? '/chat' : `/chat/${id}`); setShowUserList(false); }}
        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${isActive ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-zinc-800/50'}`}>
        <div className="relative">
          {isGlobal ? <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700"><i className="fas fa-globe-asia text-yellow-500"></i></div> 
                   : <img src={img || DEFAULT_PROFILE_IMG} className="w-10 h-10 rounded-full object-cover" alt="" />}
          {unread > 0 && <div className="absolute -top-1 -right-1 bg-red-600 text-[8px] text-white font-black px-1.5 py-0.5 rounded-full border-2 border-zinc-900">{unread > 9 ? '9+' : unread}</div>}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className={`text-xs font-black truncate ${isActive ? 'text-yellow-500' : 'text-zinc-300'}`}>{label}</p>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{isGlobal ? 'Channel' : 'Direct'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full gap-4 relative" onClick={() => setContextMenu(null)}>
      {/* Sidebar (PC Only / Mobile Toggle) */}
      <div className={`fixed inset-0 z-[200] lg:relative lg:z-0 lg:flex lg:w-72 flex-col bg-zinc-950/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none transition-transform duration-300 ${showUserList ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800 p-5 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-yellow-500 italic uppercase">Messages</h3>
            <button onClick={() => setShowUserList(false)} className="lg:hidden text-zinc-500"><i className="fas fa-times"></i></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            <SidebarItem id="global" label="글로벌 광장" isGlobal />
            <div className="h-px bg-zinc-800/50 my-4"></div>
            {Object.values(usersRecord).filter(u => u.id !== user.id).map(u => <SidebarItem key={u.id} id={u.id} label={u.nick} img={u.img} />)}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowUserList(true)} className="lg:hidden w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-yellow-500"><i className="fas fa-bars"></i></button>
            <p className="text-xs font-black text-white italic uppercase tracking-tight">{chatType === 'global' ? '🌍 글로벌 광장' : `👤 ${usersRecord[targetId!]?.nick}님`}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar px-1">
          {filteredMessages.map((m) => {
            const isMe = m.senderId === user.id;
            const unreadCount = chatType === 'global' ? getGlobalUnreadCount(m) : getDMUnread(m);
            const isHighlighted = highlightedMsgId === m.id;

            return (
              /* Fix: Wrap the ref assignment in curly braces to ensure it returns void, avoiding TS error when assignment returns the assigned value. */
              <div key={m.id} ref={el => { messageRefs.current[m.id] = el; }} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg: m }); }} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 transition-all duration-500 ${isHighlighted ? 'bg-yellow-500/10 rounded-xl p-2 scale-105 shadow-lg' : ''}`}>
                {!isMe && <img src={usersRecord[m.senderId]?.img || m.senderImg} className="w-8 h-8 rounded-full border border-zinc-800 object-cover mt-1" alt="" />}
                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[9px] font-black text-zinc-500 ml-1 mb-0.5">{m.senderNick}</span>}
                  
                  {m.replyTo && (
                    <div onClick={() => scrollToMessage(m.replyTo!.id)} className={`mb-1 px-3 py-1.5 rounded-xl bg-zinc-800/80 border-l-4 border-yellow-500/50 text-[10px] text-zinc-500 cursor-pointer hover:bg-zinc-700 transition-colors ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                      <p className="font-black text-yellow-500/50">@{m.replyTo.senderNick}</p>
                      <p className="truncate italic">{m.replyTo.text}</p>
                    </div>
                  )}

                  <div className="flex items-end gap-1.5">
                    {isMe && unreadCount !== null && <span className="text-[9px] font-black text-yellow-500 mb-1">{unreadCount}</span>}
                    <div className={`px-4 py-2.5 rounded-[1.25rem] text-[13px] font-bold shadow-md break-all ${isMe ? 'bg-yellow-500 text-black rounded-tr-none' : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700/50'} ${m.isDeleted ? 'opacity-40 italic' : ''}`}>
                      {m.text}
                    </div>
                    {!isMe && unreadCount !== null && <span className="text-[9px] font-black text-yellow-500 mb-1">{unreadCount}</span>}
                  </div>
                  <span className="text-[7px] text-zinc-700 font-bold uppercase mt-1 px-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="mt-4">
          {replyTarget && (
            <div className="bg-zinc-800/80 p-3 rounded-t-2xl border-x border-t border-zinc-700 flex justify-between items-center animate-slideUp">
              <div>
                <p className="text-[10px] font-black text-yellow-500">@{replyTarget.senderNick} 답장 중</p>
                <p className="text-[10px] text-zinc-500 truncate">{replyTarget.text}</p>
              </div>
              <button onClick={() => setReplyTarget(null)} className="text-zinc-500"><i className="fas fa-times"></i></button>
            </div>
          )}
          <form onSubmit={handleSend} className={`flex gap-2 p-1 bg-zinc-900 border border-zinc-800 ${replyTarget ? 'rounded-b-2xl border-t-0' : 'rounded-2xl shadow-xl'}`}>
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder="메시지를 입력하세요..." className="flex-1 bg-transparent px-5 py-4 text-sm font-bold text-white outline-none" />
            <button type="submit" className="w-12 h-12 bg-yellow-500 text-black rounded-xl active:scale-90 transition-transform"><i className="fas fa-paper-plane"></i></button>
          </form>
        </div>
      </div>

      {contextMenu && (
        <div className="fixed z-[1000] bg-zinc-800 border border-zinc-700 shadow-2xl rounded-xl p-1 w-32 animate-fadeIn" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { setReplyTarget(contextMenu.msg); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs font-black text-yellow-500 hover:bg-yellow-500/10 rounded-lg">답장하기</button>
          {contextMenu.msg.senderId === user.id && <button onClick={() => { api.deleteMessage(contextMenu.msg.id); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs font-black text-red-500 hover:bg-red-500/10 rounded-lg">삭제하기</button>}
        </div>
      )}
    </div>
  );
};

export default Chat;