
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';

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
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 데이터 로딩 대기를 위한 효과
  useEffect(() => {
    setError('');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    setError('');
    setIsProcessing(true);

    const cleanId = id.trim();
    const cleanPw = pw.trim();

    // 인위적인 지연을 주어 Gun.js 데이터 동기화 시간을 확보 (네트워크 레이턴시 고려)
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (!cleanId || !cleanPw) throw new Error('아이디와 비밀번호를 모두 입력해주세요.');

      if (mode === 'signup') {
        if (cleanPw.length < 4) throw new Error('비밀번호는 4자 이상이어야 합니다.');
        if (cleanPw !== confirmPw.trim()) throw new Error('비밀번호 확인이 일치하지 않습니다.');
        
        // 이미 존재하는 유저인지 확인
        if (users[cleanId]) {
          throw new Error('이미 사용 중인 아이디입니다.');
        }

        const newUser: User = {
          id: cleanId, 
          pw: cleanPw, 
          balance: 10000000, 
          nick: cleanId,
          bio: '반갑습니다!',
          img: DEFAULT_PROFILE_IMG, 
          isAdmin: cleanId === 'admin',
          gallery: []
        };
        
        await onLogin(newUser); 
        alert('회원가입이 완료되었습니다!');
        navigate('/', { replace: true });
      } else {
        // 관리자 계정 하드코딩 예외 처리
        if (cleanId === 'admin' && cleanPw === 'admin0505') {
          const adminUser: User = users['admin'] || {
            id: 'admin', pw: 'admin0505', balance: 999999999, nick: '최고관리자', 
            bio: '시스템 총괄 제어', img: 'https://picsum.photos/seed/admin/200/200', isAdmin: true,
            gallery: []
          };
          await onLogin(adminUser);
          navigate('/', { replace: true });
          return;
        }

        const user = users[cleanId];
        if (user && user.pw === cleanPw) {
          await onLogin(user);
          navigate('/', { replace: true });
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

  return (
    <div className="flex-1 flex flex-col justify-center px-10 bg-zinc-950">
      <div className="mb-12 text-center animate-fadeIn">
        <h1 className="text-4xl font-black text-yellow-500 italic tracking-tighter mb-2 uppercase">LUCKY STRIKE</h1>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">보안 네트워크 접속</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold py-3 px-4 rounded-xl text-center animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit" disabled={isProcessing}
          className="mt-4 w-full py-5 bg-yellow-500 text-black font-black text-lg rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 border-b-4 border-yellow-700"
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
