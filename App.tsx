
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, Message, Post } from './types';
import { api } from './services/apiService';
import Auth from './components/Auth';
import SlotMachine from './components/SlotMachine';
import Ranking from './components/Ranking';
import Profile from './components/Profile';
import Admin from './components/Admin';
import Chat from './components/Chat';
import Board from './components/Board';
import PostDetail from './components/PostDetail'; // 새 컴포넌트
import Layout from './components/Layout';

const App: React.FC = () => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const startApp = async () => {
      await api.init();
      
      api.subscribeUsers((newUserData) => { 
        if (!isMounted) return;
        setUsers(prev => ({ ...prev, ...newUserData })); 
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
            return [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp).slice(-500);
          });
        }
      });

      api.subscribeBoard((post) => {
        if (isMounted) {
          setPosts(prev => {
            const idx = prev.findIndex(p => p.id === post.id);
            if (idx > -1) {
              const next = [...prev];
              next[idx] = post;
              return next;
            }
            return [post, ...prev];
          });
        }
      });

      setTimeout(() => { if (isMounted) setIsLoading(false); }, 1200);
    };
    startApp();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (Object.keys(users).length > 0 && !currentUser) {
      const sessionUserId = localStorage.getItem('lucky_session');
      if (sessionUserId && users[sessionUserId]) {
        setCurrentUser(users[sessionUserId]);
      }
    }
  }, [users, currentUser]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('lucky_session');
    setCurrentUser(null);
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    await api.saveUser(updatedUser);
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
  }, [currentUser]);

  const deleteUser = useCallback(async (userId: string) => {
    await api.deleteUser(userId);
    if (currentUser?.id === userId) handleLogout();
  }, [currentUser, handleLogout]);

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
          <Route path="/" element={<Layout user={currentUser} onLogout={handleLogout} />}>
            <Route index element={<SlotMachine user={currentUser} onUpdateUser={updateUser} />} />
            <Route path="feed" element={<Board user={currentUser} posts={posts} />} />
            <Route path="feed/:postId" element={<PostDetail user={currentUser} posts={posts} />} />
            <Route path="rank" element={<Ranking users={users} />} />
            <Route path="chat" element={<Chat user={currentUser} usersRecord={users} messages={messages} onSendMessage={api.sendMessage.bind(api)} onUpdateUser={updateUser} />} />
            <Route path="chat/:targetId" element={<Chat user={currentUser} usersRecord={users} messages={messages} onSendMessage={api.sendMessage.bind(api)} onUpdateUser={updateUser} />} />
            <Route path="profile" element={<Profile user={currentUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} onLogout={handleLogout} />} />
            <Route path="profile/:id" element={<Profile user={currentUser} targetUsers={users} onUpdateUser={updateUser} onDeleteUser={deleteUser} onLogout={handleLogout} />} />
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
