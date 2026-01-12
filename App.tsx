
import React, { useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, Message } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import Auth from './components/Auth';
import SlotMachine from './components/SlotMachine';
import Ranking from './components/Ranking';
import Profile from './components/Profile';
import Admin from './components/Admin';
import Chat from './components/Chat';
import Layout from './components/Layout';

const DB_KEY = 'lucky_strike_v2_db';
const CHAT_DB_KEY = 'lucky_strike_chat_db';

const App: React.FC = () => {
  const [users, setUsers] = useLocalStorage<Record<string, User>>(DB_KEY, {});
  const [messages, setMessages] = useLocalStorage<Message[]>(CHAT_DB_KEY, []);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const getEnvironment = (): 'PC' | 'Mobile' => {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'PC';
  };

  const handleLogin = (user: User) => {
    const now = Date.now();
    const env = getEnvironment();
    const updatedUser = { ...user, lastLogin: now, environment: env };
    
    setUsers(prev => ({
      ...prev,
      [user.id]: updatedUser
    }));
    
    setCurrentUser(updatedUser);
  };

  const handleLogout = useCallback(() => {
    if (window.confirm('정말로 로그아웃 하시겠습니까?')) {
      setCurrentUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => ({
      ...prev,
      [updatedUser.id]: updatedUser
    }));
    
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  }, [currentUser, setUsers]);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => {
      const newUsers = { ...prev };
      delete newUsers[userId];
      return newUsers;
    });
    
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
  }, [currentUser, setUsers]);

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  return (
    <Router>
      <div className="flex justify-center min-h-screen bg-black">
        <div className="w-full max-w-md bg-zinc-900 shadow-2xl relative min-h-screen flex flex-col">
          <Routes>
            {!currentUser ? (
              <>
                <Route path="/login" element={<Auth mode="login" onLogin={handleLogin} users={users} setUsers={setUsers} />} />
                <Route path="/signup" element={<Auth mode="signup" onLogin={handleLogin} users={users} setUsers={setUsers} />} />
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
