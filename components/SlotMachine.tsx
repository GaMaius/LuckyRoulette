
import React, { useState, useEffect, useCallback } from 'react';
import { User, SLOT_SYMBOLS } from '../types';
import { getAILuckProphecy } from '../services/geminiService';
import { api } from '../services/apiService';

interface SlotMachineProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const SlotMachine: React.FC<SlotMachineProps> = ({ user, onUpdateUser }) => {
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣', '7️⃣', '7️⃣']);
  const [betAmount, setBetAmount] = useState<number>(100000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const [gameLog, setGameLog] = useState<{ msg: string; color: string }>({ msg: '배팅 금액을 정하고 레버를 당기세요!', color: 'text-zinc-400' });
  const [prophecy, setProphecy] = useState<string>('운명의 한 마디를 불러오는 중...');
  const [liveActivity, setLiveActivity] = useState<string>("서버에 연결 중...");

  useEffect(() => {
    // 1. 운세 업데이트 (로컬)
    const fetchProphecy = async () => {
      const tip = await getAILuckProphecy(user.nick || user.id, user.balance, reels.join(','));
      setProphecy(tip);
    };
    fetchProphecy();

    // 2. 실시간 이벤트 로그 구독
    api.subscribeEvents((newEvent) => {
      setLiveActivity(newEvent);
    });
  }, [user.id, user.balance, user.nick, reels]);

  const spin = async () => {
    if (isSpinning) return;
    if (betAmount <= 0) return alert('배팅 금액을 입력하세요.');
    if (betAmount > user.balance) return alert('잔액이 부족합니다.');

    setIsSpinning(true);
    setSpinningReels([true, true, true, true, true]);
    setGameLog({ msg: '릴이 돌아가고 있습니다...', color: 'text-yellow-500' });

    const intervals: any[] = [];
    [0, 1, 2, 3, 4].forEach((idx) => {
      const interval = setInterval(() => {
        setReels(prev => {
          const next = [...prev];
          next[idx] = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
          return next;
        });
      }, 80);
      intervals.push(interval);
    });

    const finalResults: string[] = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 600 + i * 400));
      clearInterval(intervals[i]);
      setSpinningReels(prev => {
        const next = [...prev];
        next[i] = false;
        return next;
      });
      const symbol = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      finalResults[i] = symbol;
      setReels(prev => {
        const next = [...prev];
        next[i] = symbol;
        return next;
      });
    }

    await calculateResult(finalResults);
    setIsSpinning(false);
  };

  const calculateResult = async (results: string[]) => {
    const counts: Record<string, number> = {};
    results.forEach(s => counts[s] = (counts[s] || 0) + 1);
    const maxMatch = Math.max(...Object.values(counts));

    let multiplier = -1;
    let message = "꽝! 다음 기회에... (-1배)";
    let color = "text-red-500";

    if (maxMatch === 5) { 
      multiplier = 20; 
      message = "🎰 잭팟 폭발!!! (+20배)"; 
      color = "text-yellow-400 animate-bounce";
      await api.logEvent(`💰 잭팟! [${user.nick || user.id}]님이 ${(betAmount * 20).toLocaleString()}원 당첨!`);
    }
    else if (maxMatch === 4) { 
      multiplier = 8; 
      message = "💎 초대박 당첨! (+8배)"; 
      color = "text-blue-400";
      await api.logEvent(`💎 대박! [${user.nick || user.id}]님이 ${(betAmount * 8).toLocaleString()}원 획득!`);
    }
    else if (maxMatch === 3) { 
      multiplier = 3; 
      message = "✨ 당첨되었습니다! (+3배)"; 
      color = "text-green-400"; 
    }

    const profit = betAmount * multiplier;
    const nextBalance = user.balance + profit;
    
    // 데이터베이스 업데이트 (공유됨)
    onUpdateUser({ ...user, balance: nextBalance });
    
    setGameLog({ msg: `${message} ${profit > 0 ? '+' : ''}${profit.toLocaleString()}원`, color });

    if (nextBalance <= 0) {
      alert('파산하셨습니다! 기본 자금 100만원이 재충전됩니다.');
      onUpdateUser({ ...user, balance: 1000000 });
      await api.logEvent(`💸 [${user.nick || user.id}]님이 파산하여 재기 중입니다.`);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      <div className="bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl overflow-hidden shadow-inner flex items-center gap-2">
        <span className="flex-shrink-0 text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-sm font-black animate-pulse">LIVE</span>
        <p className="text-[10px] font-black text-red-500 italic whitespace-nowrap overflow-hidden text-ellipsis">
          {liveActivity}
        </p>
      </div>

      <div className="bg-zinc-800/80 rounded-2xl p-4 border border-yellow-500/20 shadow-lg min-h-[90px] flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <i className="fas fa-scroll text-4xl text-yellow-500"></i>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <i className="fas fa-magic text-yellow-400 text-[10px]"></i>
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-tighter">운명의 명대사</span>
        </div>
        <p className="text-sm italic font-medium leading-tight text-zinc-100 pr-2 relative z-10">
          "{prophecy}"
        </p>
      </div>

      <div className="bg-zinc-800 border-4 border-yellow-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex justify-center gap-2 mb-6">
          {reels.map((symbol, i) => (
            <div 
              key={i} 
              className={`w-14 h-20 bg-zinc-100 rounded-lg flex items-center justify-center text-3xl shadow-inner border-2 border-zinc-400 transition-all ${spinningReels[i] ? 'reel-spin' : ''}`}
            >
              {symbol}
            </div>
          ))}
        </div>

        <div className={`text-center font-black mb-6 h-6 transition-all text-sm tracking-tighter ${gameLog.color}`}>
          {gameLog.msg}
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-black border border-zinc-700 rounded-xl py-4 px-4 text-center font-black text-yellow-500 text-lg focus:outline-none focus:border-yellow-400 transition-all"
              disabled={isSpinning}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setBetAmount(Math.floor(user.balance / 4))}
              className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-[10px] font-black transition-all"
              disabled={isSpinning}
            >
              25% 베팅
            </button>
            <button
              onClick={() => setBetAmount(user.balance)}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-[10px] font-black transition-all"
              disabled={isSpinning}
            >
              ALL-IN
            </button>
          </div>

          <button
            onClick={spin}
            disabled={isSpinning}
            className={`w-full py-5 rounded-xl font-black text-xl italic shadow-2xl active:scale-95 transition-all ${
              isSpinning ? 'bg-zinc-600 text-zinc-400' : 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:brightness-110'
            }`}
          >
            {isSpinning ? 'SPINNING...' : '🎰 SPIN START!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotMachine;
