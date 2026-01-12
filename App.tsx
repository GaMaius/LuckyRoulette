
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

  // 실시간 구독 설정
  useEffect(() => {
    let isMounted = true;

    // 1. 유저 데이터 실시간 구독
    api.subscribeUsers((newUserData) => {
      if (!isMounted) return;
      setUsers(prev => ({ ...prev, ...newUserData }));
    });

    // 2. 메시지 실시간 구독
    api.subscribeMessages((newMsg) => {
      if (!isMounted) return;
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        const updated = [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp);
        return updated.slice(-100); 
      });
    });

    // 충분한 피어 연결 시간을 위해 로딩 지연
    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // 현재 세션 유저 정보 동기화
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
    
    // DB 저장 (네트워크 공유)
    await api.saveUser(updatedUser);
    
    // 전역 이벤트 기록
    if (isNew) {
      await api.logEvent(`✨ 신규 엔티티 [${updatedUser.id}] 합류`);
    } else {
      await api.logEvent(`👋 [${updatedUser.nick || updatedUser.id}] 세션 연결됨`);
    }

    setCurrentUser(updatedUser);
  };

  const handleLogout = useCallback(() => {
    if (window.confirm('정말로 로그아웃 하시겠습니까?')) {
      setCurrentUser(null);
    }
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    await api.saveUser(updatedUser);
    // 로컬 상태 즉시 반영 (반응성 향상)
    setUsers(prev => ({ ...prev, [updatedUser.id]: updatedUser }));
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    await api.deleteUser(userId);
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
  }, [currentUser]);

  const addMessage = async (msg: Message) => {
    await api.sendMessage(msg);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-yellow-500 flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-black italic tracking-tighter animate-pulse">SYNCING WITH GLOBAL PEERS</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">P2P Cloud Mesh Network Connecting...</p>
          </div>
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
