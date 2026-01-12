
import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      if (!id || !pw) throw new Error('정보를 모두 입력해주세요.');

      if (mode === 'signup') {
        if (pw !== confirmPw) throw new Error('비밀번호가 일치하지 않습니다.');
        if (users[id]) throw new Error('이미 사용 중인 아이디입니다.');

        const newUser: User = {
          id, pw, balance: 10000000, nick: '', bio: '',
          img: DEFAULT_PROFILE_IMG, isAdmin: id === 'admin'
        };
        await onLogin(newUser); // handleLogin 내부에서 api.saveUser 호출
        alert('회원가입 성공! 클라우드 계정이 생성되었습니다.');
        navigate('/');
      } else {
        const user = users[id];
        if (user && user.pw === pw) {
          await onLogin(user);
          navigate('/');
        } else if (id === 'admin' && pw === 'admin0505') {
          await onLogin({
            id: 'admin', pw: 'admin0505', balance: 999999999, nick: '운영자', 
            bio: '관리자', img: 'https://picsum.photos/seed/admin/200/200', isAdmin: true
          });
          navigate('/');
        } else {
          throw new Error('아이디 또는 비밀번호가 틀렸습니다.');
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
        <h1 className="text-4xl font-black text-yellow-500 italic tracking-tighter mb-3 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">🎰 럭키 스트라이크</h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest opacity-80">Shared Cloud Social Game</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-1">
          <input
            type="text" value={id} onChange={(e) => setId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all"
            placeholder="아이디" disabled={isProcessing}
          />
        </div>
        <div className="space-y-1">
          <input
            type="password" value={pw} onChange={(e) => setPw(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all"
            placeholder="비밀번호" disabled={isProcessing}
          />
        </div>
        {mode === 'signup' && (
          <input
            type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 animate-slideUp"
            placeholder="비밀번호 확인" disabled={isProcessing}
          />
        )}

        {error && <p className="text-red-500 text-[10px] font-bold text-center animate-shake">{error}</p>}

        <button
          type="submit" disabled={isProcessing}
          className="mt-4 w-full py-4 bg-yellow-500 text-black font-black text-lg rounded-xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>

      <div className="mt-10 text-center text-xs font-bold text-zinc-500">
        {mode === 'login' ? (
          <Link to="/signup" className="text-yellow-500">계정이 없으신가요? 가입하기</Link>
        ) : (
          <Link to="/login" className="text-yellow-500">이미 회원이신가요? 로그인하기</Link>
        )}
      </div>
    </div>
  );
};

export default Auth;
