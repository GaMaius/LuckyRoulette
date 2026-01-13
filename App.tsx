
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
      api.onConnectionChange((count) => { if (isMounted) setPeerCount(count); });
      api.subscribeUsers((newUserData) => { if (isMounted) setUsers(prev => ({ ...prev, ...newUserData })); });
      api.subscribeMessages((newMsg) => {
        if (isMounted) {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp).slice(-200);
          });
        }
      });
      setTimeout(() => { if (isMounted) setIsLoading(false); }, 1500);
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

  const handleLogin = async (user: User) => {
    const updatedUser: User = { 
      ...user, 
      lastLogin: Date.now(), 
      environment: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'PC' 
    };
    await api.saveUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  const updateUser = useCallback(async (updatedUser: User) => {
    await api.saveUser(updatedUser);
    setUsers(prev => ({ ...prev, [updatedUser.id]: updatedUser }));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  }, [currentUser]);

  const deleteUser = useCallback(async (userId: string) => {
    await api.deleteUser(userId);
    if (currentUser?.id === userId) setCurrentUser(null);
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-yellow-500 flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <h1 className="text-2xl font-black italic tracking-tighter text-white animate-pulse">LUCKY STRIKE AI</h1>
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
                <Route path="/login" element={<Auth mode="login" onLogin={handleLogin} users={users} setUsers={() => {}} />} />
                <Route path="/signup" element={<Auth mode="signup" onLogin={handleLogin} users={users} setUsers={() => {}} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <Route path="/" element={<Layout user={currentUser} onLogout={() => setCurrentUser(null)} />}>
                <Route index element={<SlotMachine user={currentUser} onUpdateUser={updateUser} />} />
                <Route path="feed" element={<SharedGallery user={currentUser} />} />
                <Route path="rank" element={<Ranking users={users} />} />
                <Route path="chat" element={<Chat user={currentUser} usersRecord={users} messages={messages} onSendMessage={api.sendMessage.bind(api)} onUpdateUser={updateUser} />} />
                <Route path="chat/:targetId" element={<Chat user={currentUser} usersRecord={users} messages={messages} onSendMessage={api.sendMessage.bind(api)} onUpdateUser={updateUser} />} />
                <Route path="profile" element={<Profile user={currentUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} onLogout={() => setCurrentUser(null)} />} />
                <Route path="profile/:id" element={<Profile user={currentUser} targetUsers={users} onUpdateUser={updateUser} onDeleteUser={deleteUser} onLogout={() => setCurrentUser(null)} />} />
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
