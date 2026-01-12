
import React, { useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import Auth from './components/Auth';
import SlotMachine from './components/SlotMachine';
import Ranking from './components/Ranking';
import Profile from './components/Profile';
import Admin from './components/Admin';
import Layout from './components/Layout';

const DB_KEY = 'lucky_strike_v2_db';

const App: React.FC = () => {
  const [users, setUsers] = useLocalStorage<Record<string, User>>(DB_KEY, {});
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = useCallback(() => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      setCurrentUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => ({
      ...prev,
      [updatedUser.id]: updatedUser
    }));
    // 현재 로그인한 사용자와 일치하면 상태 업데이트
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
    
    // 삭제하려는 대상이 나 자신일 경우 로그아웃 처리
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
  }, [currentUser, setUsers]);

  return (
    <Router>
      <div className="flex justify-center min-h-screen bg-black">
        <div className="w-full max-w-md bg-zinc-900 shadow-2xl relative min-h-screen flex flex-col">
          <Routes>
            {!currentUser ? (
              <>
                <Route path="/login" element={<Auth mode="login" onLogin={handleLogin} users={users} setUsers={setUsers} />} />
                <Route path="/signup" element={<Auth mode="signup" onLogin={handleLogin} users={users} setUsers={setUsers} />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            ) : (
              <Route path="/" element={<Layout user={currentUser} onLogout={handleLogout} />}>
                <Route index element={<SlotMachine user={currentUser} onUpdateUser={updateUser} />} />
                <Route path="rank" element={<Ranking users={users} />} />
                <Route path="profile" element={<Profile user={currentUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} onLogout={handleLogout} />} />
                <Route path="profile/:id" element={<Profile user={currentUser} targetUsers={users} onUpdateUser={updateUser} onDeleteUser={deleteUser} onLogout={handleLogout} />} />
                {currentUser.isAdmin && (
                  <Route path="admin" element={<Admin users={users} onUpdateUser={updateUser} onDeleteUser={deleteUser} />} />
                )}
                <Route path="*" element={<Navigate to="/" />} />
              </Route>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
