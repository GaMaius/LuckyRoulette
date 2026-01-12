
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, Message, ConnectionStatus } from './types';
import { api } from './services/apiService';
import Auth from './components/Auth';
import SlotMachine from './components/SlotMachine';
import Ranking from './components/Ranking';
import Profile from './components/Profile';
import Admin from './components/Admin';
import Chat from './components/Chat';
import SharedGallery from './components/SharedGallery';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기화 로직
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const connStatus = await api.init();
        if (!isMounted) return;
        setStatus(connStatus);

        // 동기화 구독 시작
        api.subscribeUsers((newUserData) => {
          setUsers(prev => ({ ...prev, ...newUserData }));
        });

        api.subscribeMessages((newMsg) => {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            const updated = [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp);
            return updated.slice(-100); 
          });
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Initialization Failed:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    initialize();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (currentUser && users[currentUser.id]) {
      const serverUser = users[currentUser.id];
      if (JSON.stringify(serverUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(serverUser);
      }
    }
  }, [users, currentUser]);

  const handleLogin = async (user: User, isNew: boolean = false) => {
    const updatedUser: User = { 
      ...user, 
      lastLogin: Date.now(), 
      environment: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'PC' 
    };
    await api.saveUser(updatedUser);
    const peerInfo = status?.connected ? `Connected: ${status.activePeers.length} Peers` : 'Offline Mode';
    await api.logEvent(`👋 [${updatedUser.nick || updatedUser.id}] Sync Start (${peerInfo})`);
    setCurrentUser(updatedUser);
  };

  const handleLogout = useCallback(() => {
    if (window.confirm('정말로 로그아웃 하시겠습니까?')) setCurrentUser(null);
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    await api.saveUser(updatedUser);
    setUsers(prev => ({ ...prev, [updatedUser.id]: updatedUser }));
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    await api.deleteUser(userId);
    if (currentUser?.id === userId) setCurrentUser(null);
  }, [currentUser]);

  const addMessage = async (msg: Message) => {
    await api.sendMessage(msg);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-yellow-500 flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-2 border-yellow-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-2 border-yellow-500/20 border-b-transparent rounded-full animate-spin-slow"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-2xl font-black italic tracking-tighter text-white animate-pulse">ESTABLISHING MESH</p>
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Searching available global peers...</span>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex justify-center min-h-screen bg-black overflow-hidden font-pretendard">
        <div className="w-full max-w-md bg-zinc-900 shadow-2xl relative min-h-screen flex flex-col border-x border-zinc-800/50">
          {/* 하단 연결 상태 인디케이터 */}
          {!currentUser && (
            <div className="absolute bottom-4 left-0 right-0 text-center z-10">
              <p className={`text-[7px] font-black uppercase tracking-widest ${status?.connected ? 'text-green-500' : 'text-zinc-500'}`}>
                {status?.connected ? `● PEER CONNECTED (${status.activePeers.length})` : '○ LOCAL STORAGE ONLY'}
              </p>
            </div>
          )}
          
          <Routes>
            {!currentUser ? (
              <>
                <Route path="/login" element={<Auth mode="login" onLogin={(u) => handleLogin(u, false)} users={users} setUsers={() => {}} />} />
                <Route path="/signup" element={<Auth mode="signup" onLogin={(u) => handleLogin(u, true)} users={users} setUsers={() => {}} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <Route path="/" element={<Layout user={currentUser} onLogout={handleLogout} />}>
                <Route index element={<SlotMachine user={currentUser} onUpdateUser={updateUser} />} />
                <Route path="feed" element={<SharedGallery user={currentUser} />} />
                <Route path="rank" element={<Ranking users={users} />} />
                <Route path="chat" element={<Chat user={currentUser} users={users} messages={messages} onSendMessage={addMessage} />} />
                <Route path="chat/:targetId" element={<Chat user={currentUser} users={users} messages={messages} onSendMessage={addMessage} />} />
                <Route path="inquiry" element={<Navigate to="/chat/admin" replace />} />
                <Route path="profile" element={<Profile user={currentUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} onLogout={handleLogout} />} />
                <Route path="profile/:id" element={<Profile user={currentUser} targetUsers={users} onUpdateUser={updateUser} onDeleteUser={deleteUser} onLogout={handleLogout} />} />
                {currentUser.isAdmin && (
                  <Route path="admin" element={<Admin users={users} onUpdateUser={updateUser} onDeleteUser={deleteUser} />} />
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
