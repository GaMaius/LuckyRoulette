import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, Message } from './types';
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
  const [peerCount, setPeerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const startApp = async () => {
      await api.init();
      
      api.onConnectionChange((count) => {
        if (isMounted) setPeerCount(count);
      });

      api.subscribeUsers((newUserData) => {
        if (isMounted) setUsers(prev => ({ ...prev, ...newUserData }));
      });

      api.subscribeMessages((newMsg) => {
        if (isMounted) {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp).slice(-100);
          });
        }
      });

      // 동기화 준비 완료 후 로딩 해제 (최소 1초 지연으로 로고 노출)
      setTimeout(() => {
        if (isMounted) setIsLoading(false);
      }, 1000);
    };

    startApp();
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
    const syncStatus = peerCount > 0 ? `Global Mesh (${peerCount} Peers)` : 'Local Cache Mode';
    await api.logEvent(`👋 [${updatedUser.nick || updatedUser.id}] Sync Active: ${syncStatus}`);
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
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2 drop-shadow-2xl">LUCKY STRIKE</h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] animate-pulse">
              Initializing P2P Sync Engine...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex justify-center min-h-screen bg-black overflow-hidden font-pretendard">
        <div className="w-full max-w-md bg-zinc-900 shadow-2xl relative min-h-screen flex flex-col border-x border-zinc-800/50">
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
                <Route path="chat" element={<Chat user={currentUser} usersRecord={users} messages={messages} onSendMessage={addMessage} />} />
                <Route path="chat/:targetId" element={<Chat user={currentUser} usersRecord={users} messages={messages} onSendMessage={addMessage} />} />
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