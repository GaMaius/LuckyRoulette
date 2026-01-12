
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, DEFAULT_PROFILE_IMG } from '../types';

interface AuthProps {
  mode: 'login' | 'signup';
  onLogin: (user: User) => void;
  users: Record<string, User>;
  setUsers: (users: Record<string, User>) => void;
}

const Auth: React.FC<AuthProps> = ({ mode, onLogin, users, setUsers }) => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');

  const validatePassword = (password: string) => {
    // 영문, 숫자, 특수문자 포함 6자 이상 정규식
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return regex.test(password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id || !pw) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (mode === 'signup') {
      if (pw !== confirmPw) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      if (!validatePassword(pw)) {
        setError('보안 경고: 비밀번호는 영문, 숫자, 특수문자를 포함하여 6자리 이상이어야 합니다.');
        return;
      }

      if (users[id]) {
        setError('이미 사용 중인 아이디입니다.');
        return;
      }

      const newUser: User = {
        id,
        pw,
        balance: 10000000, // 초기 자금 1000만원
        nick: '',
        bio: '',
        img: DEFAULT_PROFILE_IMG,
        isAdmin: id === 'admin'
      };
      setUsers({ ...users, [id]: newUser });
      alert('회원가입이 완료되었습니다! 이제 로그인할 수 있습니다.');
      navigate('/login');
    } else {
      // 일반 사용자 체크
      const user = users[id];
      if (user && user.pw === pw) {
        onLogin(user);
        navigate('/');
      } 
      // 기본 관리자 체크
      else if (id === 'admin' && pw === 'admin0505') {
        const adminUser: User = {
          id: 'admin',
          pw: 'admin0505',
          balance: 9999999999,
          nick: '총괄 관리자',
          bio: '시스템 총괄 운영자입니다.',
          img: 'https://picsum.photos/seed/admin/200/200',
          isAdmin: true
        };
        onLogin(adminUser);
        navigate('/');
      } 
      else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-10 bg-zinc-950">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-yellow-500 italic tracking-tighter mb-3">🎰 럭키 스트라이크</h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">인공지능 슬롯 머신 & 커뮤니티</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">사용자 아이디</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all"
            placeholder="아이디를 입력하세요"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">비밀번호</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5 animate-fadeIn">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">비밀번호 확인</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-5 font-bold text-white focus:outline-none focus:border-yellow-500 transition-all"
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>
        )}

        {error && <p className="text-red-500 text-[10px] font-bold text-center animate-pulse leading-tight">{error}</p>}

        <button
          type="submit"
          className="mt-4 w-full py-4 bg-yellow-500 text-black font-black text-lg rounded-xl shadow-xl shadow-yellow-500/20 active:scale-95 transition-all"
        >
          {mode === 'login' ? '로그인하기' : '무료 회원가입'}
        </button>
      </form>

      <div className="mt-10 text-center">
        {mode === 'login' ? (
          <p className="text-zinc-500 text-xs font-bold">
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className="text-yellow-500 underline decoration-yellow-500/30 ml-1">
              지금 가입하세요
            </Link>
          </p>
        ) : (
          <p className="text-zinc-500 text-xs font-bold">
            이미 회원이신가요?{' '}
            <Link to="/login" className="text-yellow-500 underline decoration-yellow-500/30 ml-1">
              로그인하기
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
