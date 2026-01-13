
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

    // ID/PW에서 공백 제거
    const cleanId = id.trim();
    const cleanPw = pw.trim();

    try {
      if (!cleanId || !cleanPw) throw new Error('아이디와 비밀번호를 모두 입력해주세요.');

      if (mode === 'signup') {
        if (cleanPw !== confirmPw.trim()) throw new Error('비밀번호 확인이 일치하지 않습니다.');
        if (users[cleanId]) throw new Error('이미 존재하는 아이디입니다. 다른 아이디를 사용하세요.');

        const newUser: User = {
          id: cleanId, 
          pw: cleanPw, 
          balance: 10000000, 
          nick: cleanId, // 기본 닉네임을 ID로 설정
          bio: '반갑습니다!',
          img: DEFAULT_PROFILE_IMG, 
          isAdmin: cleanId === 'admin',
          gallery: []
        };
        
        await onLogin(newUser); 
        alert('🎉 가입 성공! 럭키 스트라이크의 세계에 오신 것을 환영합니다.');
        navigate('/', { replace: true });
      } else {
        // 관리자 특수 계정 처리
        if (cleanId === 'admin' && cleanPw === 'admin0505') {
          const adminUser: User = users['admin'] || {
            id: 'admin', pw: 'admin0505', balance: 999999999, nick: '운영자', 
            bio: '시스템 관리자', img: 'https://picsum.photos/seed/admin/200/200', isAdmin: true,
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
          throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
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
        <h1 className="text-4xl font-black text-yellow-500 italic tracking-tighter mb-3 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] uppercase">Lucky Strike</h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest opacity-80">Decentralized Social Slot</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-1">
          <input
            type="text" value={id} onChange={(e) => setId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-600"
            placeholder="아이디 (ID)" disabled={isProcessing}
          />
        </div>
        <div className="space-y-1">
          <input
            type="password" value={pw} onChange={(e) => setPw(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-600"
            placeholder="비밀번호 (Password)" disabled={isProcessing}
          />
        </div>
        {mode === 'signup' && (
          <input
            type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 animate-slideUp placeholder:text-zinc-600"
            placeholder="비밀번호 확인" disabled={isProcessing}
          />
        )}

        {error && <p className="text-red-500 text-[11px] font-black text-center animate-shake bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

        <button
          type="submit" disabled={isProcessing}
          className="mt-4 w-full py-5 bg-yellow-500 text-black font-black text-lg rounded-2xl shadow-[0_10px_20px_rgba(234,179,8,0.2)] active:scale-95 transition-all disabled:opacity-50 border-b-4 border-yellow-700"
        >
          {isProcessing ? '신호 동기화 중...' : mode === 'login' ? '접속 승인' : '계정 생성'}
        </button>
      </form>

      <div className="mt-10 text-center text-[10px] font-black uppercase tracking-widest">
        {mode === 'login' ? (
          <Link to="/signup" className="text-zinc-500 hover:text-yellow-500 transition-colors">계정이 없으신가요? <span className="text-yellow-500">신규 등록</span></Link>
        ) : (
          <Link to="/login" className="text-zinc-500 hover:text-yellow-500 transition-colors">이미 회원이신가요? <span className="text-yellow-500">보안 로그인</span></Link>
        )}
      </div>
    </div>
  );
};

export default Auth;
