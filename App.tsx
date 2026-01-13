
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
import Board from './components/Board';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const startApp = async () => {
      await api.init();
      api.subscribeUsers((newUserData) => { 
        if (!isMounted) return;
        setUsers(prev => {
          const id = Object.keys(newUserData)[0];
          if (newUserData[id] === null) {
            const { [id]: _, ...rest } = prev;
            return rest;
          }
          return { ...prev, ...newUserData };
        }); 
      });
      api.subscribeMessages((newMsg) => {
        if (isMounted) {
          setMessages(prev => {
            const idx = prev.findIndex(m => m.id === newMsg.id);
            if (idx > -1) {
              const next = [...prev];
              next[idx] = newMsg;
              return next;
            }
            return [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp).slice(-300);
          });
        }
      });
      setTimeout(() => { if (isMounted) setIsLoading(false); }, 1500);
    };
    startApp();
    return () => { isMounted = false; };
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    await api.saveUser(updatedUser);
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
  }, [currentUser]);

  const deleteUser = useCallback(async (userId: string) => {
    await api.deleteUser(userId);
    if (currentUser?.id === userId) {
      setCurrentUser(null);
      window.location.href = '#/login';
    }
    setUsers(prev => {
      const { [userId]: _, ...rest } = prev;
      return rest;
    });
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!currentUser ? (
          <>
            <Route path="/login" element={<Auth mode="login" onLogin={setCurrentUser} users={users} setUsers={() => {}} />} />
            <Route path="/signup" element={<Auth mode="signup" onLogin={setCurrentUser} users={users} setUsers={() => {}} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/" element={<Layout user={currentUser} onLogout={() => setCurrentUser(null)} />}>
            <Route index element={<SlotMachine user={currentUser} onUpdateUser={updateUser} />} />
            <Route path="feed" element={<Board user={currentUser} />} />
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
    </Router>
  );
};

export default App;
