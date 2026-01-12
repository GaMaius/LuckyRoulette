
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
import Layout from './components/Layout';

const App: React.FC = () => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshGlobalData = useCallback(async () => {
    const [fetchedUsers, fetchedMessages] = await Promise.all([
      api.getUsers(),
      api.getMessages()
    ]);
    setUsers(fetchedUsers);
    setMessages(fetchedMessages);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      await refreshGlobalData();
      setIsLoading(false);
    };
    initApp();

    const interval = setInterval(refreshGlobalData, 5000);
    return () => clearInterval(interval);
  }, [refreshGlobalData]);

  const handleLogin = async (user: User, isNew: boolean = false) => {
    const updatedUser = { 
      ...user, 
      lastLogin: Date.now(), 
      environment: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'PC' as any 
    };
    await api.saveUser(updatedUser);
    
    // 리얼 이벤트 로그 기록
    if (isNew) {
      await api.logEvent(`✨ 신규 유저 [${updatedUser.id}]님이 럭키 스트라이크에 합류했습니다!`);
    } else {
      await api.logEvent(`👋 [${updatedUser.nick || updatedUser.id}]님이 접속했습니다.`);
    }

    setCurrentUser(updatedUser);
    await refreshGlobalData();
  };

  const handleLogout = useCallback(() => {
    if (window.confirm('정말로 로그아웃 하시겠습니까?')) {
      setCurrentUser(null);
    }
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    await api.saveUser(updatedUser);
    setUsers(prev => ({ ...prev, [updatedUser.id]: updatedUser }));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  }, [currentUser]);

  const deleteUser = useCallback(async (userId: string) => {
    await api.deleteUser(userId);
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    await refreshGlobalData();
  }, [currentUser, refreshGlobalData]);

  const addMessage = async (msg: Message) => {
    await api.sendMessage(msg);
    setMessages(prev => [...prev, msg]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-yellow-500 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black italic tracking-tighter">SERVER CONNECTING...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex justify-center min-h-screen bg-black">
        <div className="w-full max-w-md bg-zinc-900 shadow-2xl relative min-h-screen flex flex-col">
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
