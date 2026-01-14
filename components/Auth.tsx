
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';
import { api } from '../services/apiService';

interface AuthProps {
  mode: 'login' | 'signup';
  onLogin: (user: User) => void;
  users: Record<string, User>;
  setUsers: (users: Record<string, User>) => void;
}

const Auth: React.FC<AuthProps> = ({ mode, onLogin, users }) => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('lucky_saved_id');
    if (savedId && mode === 'login') {
      setId(savedId);
      setRememberId(true);
    }
    setError('');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    setError('');
    setIsProcessing(true);

    const cleanId = id.trim();
    const cleanPw = pw.trim();

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (!cleanId || !cleanPw) throw new Error('아이디와 비밀번호를 모두 입력해주세요.');

      if (mode === 'signup') {
        if (cleanPw.length < 4) throw new Error('비밀번호는 4자 이상이어야 합니다.');
        if (cleanPw !== confirmPw.trim()) throw new Error('비밀번호 확인이 일치하지 않습니다.');
        if (users[cleanId]) throw new Error('이미 사용 중인 아이디입니다.');

        const env = window.innerWidth >= 768 ? 'PC' : 'Mobile';
        const newUser: User = {
          id: cleanId, 
          pw: cleanPw, 
          balance: 10000000, 
          nick: cleanId,
          bio: '반갑습니다!',
          img: DEFAULT_PROFILE_IMG, 
          isAdmin: cleanId === 'admin',
          gallery: [],
          environment: env,
          lastLogin: Date.now(),
          sessionLogs: [`${new Date().toLocaleString()} - 계정 생성 및 최초 접속 (${env})`]
        };
        
        await onLogin(newUser); 
        alert('회원가입이 완료되었습니다!');
        navigate('/', { replace: true });
      } else {
        const env = window.innerWidth >= 768 ? 'PC' : 'Mobile';
        
        if (cleanId === 'admin' && cleanPw === 'admin0505') {
          const existingAdmin = users['admin'];
          const adminUser: User = {
            id: 'admin', 
            pw: 'admin0505', 
            balance: existingAdmin?.balance || 999999999, 
            nick: '최고관리자', 
            bio: '시스템 총괄 제어', 
            img: 'https://picsum.photos/seed/admin/200/200', 
            isAdmin: true,
            gallery: existingAdmin?.gallery || [],
            environment: env,
            lastLogin: Date.now(),
            sessionLogs: [`${new Date().toLocaleString()} - 관리자 콘솔 접속 (${env})`, ...(existingAdmin?.sessionLogs || [])].slice(0, 20)
          };
          
          handlePostLogin(adminUser);
          return;
        }

        const user = users[cleanId];
        if (user && user.pw === cleanPw) {
          const updatedUser: User = {
            ...user,
            environment: env,
            lastLogin: Date.now(),
            sessionLogs: [`${new Date().toLocaleString()} - 로그인 성공 (${env})`, ...(user.sessionLogs || [])].slice(0, 20)
          };
          handlePostLogin(updatedUser);
        } else {
          throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostLogin = async (user: User) => {
    if (rememberId) localStorage.setItem('lucky_saved_id', user.id);
    else localStorage.removeItem('lucky_saved_id');

    if (stayLoggedIn) localStorage.setItem('lucky_session', user.id);
    else localStorage.removeItem('lucky_session');

    await api.saveUser(user);
    onLogin(user);
    navigate('/', { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-10 bg-zinc-950">
      <div className="mb-12 text-center animate-fadeIn">
        <h1 className="text-4xl font-black text-yellow-500 italic tracking-tighter mb-2 uppercase">LUCKY STRIKE</h1>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">보안 네트워크 접속</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-3">
          <input
            type="text" value={id} onChange={(e) => setId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all"
            placeholder="아이디" disabled={isProcessing}
          />
          <input
            type="password" value={pw} onChange={(e) => setPw(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all"
            placeholder="비밀번호" disabled={isProcessing}
          />
          {mode === 'signup' && (
            <input
              type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-white focus:outline-none focus:border-yellow-500 animate-slideUp"
              placeholder="비밀번호 확인" disabled={isProcessing}
            />
          )}
        </div>

        {mode === 'login' && (
          <div className="flex flex-col gap-2 px-2 py-1">
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" checked={rememberId} 
                  onChange={(e) => setRememberId(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border-2 border-zinc-700 rounded-lg bg-zinc-800 checked:bg-yellow-500 checked:border-yellow-500 transition-all cursor-pointer"
                />
                <i className="fas fa-check absolute text-[10px] text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"></i>
              </div>
              <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">아이디 기억하기</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" checked={stayLoggedIn} 
                  onChange={(e) => setStayLoggedIn(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border-2 border-zinc-700 rounded-lg bg-zinc-800 checked:bg-yellow-500 checked:border-yellow-500 transition-all cursor-pointer"
                />
                <i className="fas fa-check absolute text-[10px] text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"></i>
              </div>
              <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">로그인 상태 유지</span>
            </label>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold py-3 px-4 rounded-xl text-center animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit" disabled={isProcessing}
          className="mt-2 w-full py-5 bg-yellow-500 text-black font-black text-lg rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 border-b-4 border-yellow-700"
        >
          {isProcessing ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>

      <div className="mt-10 text-center">
        {mode === 'login' ? (
          <Link to="/signup" className="text-zinc-500 text-xs font-bold">계정이 없으신가요? <span className="text-yellow-500 ml-1">신규 가입</span></Link>
        ) : (
          <Link to="/login" className="text-zinc-500 text-xs font-bold">이미 회원이신가요? <span className="text-yellow-500 ml-1">로그인하기</span></Link>
        )}
      </div>
    </div>
  );
};

export default Auth;
