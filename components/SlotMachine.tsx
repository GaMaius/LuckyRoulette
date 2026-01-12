
import React, { useState, useEffect } from 'react';
import { User, SLOT_SYMBOLS } from '../types';
import { getAILuckProphecy } from '../services/geminiService';

interface SlotMachineProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const SlotMachine: React.FC<SlotMachineProps> = ({ user, onUpdateUser }) => {
  // 릴은 항상 5개로 고정
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣', '7️⃣', '7️⃣']);
  const [betAmount, setBetAmount] = useState<number>(100000);
  const [isSpinning, setIsSpinning] = useState(false);
  // 개별 릴의 회전 상태 관리
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const [gameLog, setGameLog] = useState<{ msg: string; color: string }>({ msg: '배팅 금액을 정하고 레버를 당기세요!', color: 'text-zinc-400' });
  const [prophecy, setProphecy] = useState<string>('운세를 읽어오는 중...');
  const [isAIThinking, setIsAIThinking] = useState(false);

  const fetchProphecy = async () => {
    setIsAIThinking(true);
    const tip = await getAILuckProphecy(user.nick || user.id, user.balance, reels.join(','));
    setProphecy(tip);
    setIsAIThinking(false);
  };

  useEffect(() => {
    fetchProphecy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = async () => {
    if (isSpinning) return;
    if (betAmount <= 0) return alert('배팅 금액을 입력하세요.');
    if (betAmount > user.balance) return alert('잔액이 부족합니다.');

    setIsSpinning(true);
    setSpinningReels([true, true, true, true, true]);
    setGameLog({ msg: '릴이 돌아가고 있습니다...', color: 'text-yellow-500' });

    const intervals: any[] = [];

    // 애니메이션 단계: 모든 릴에 대해 인터벌 시작
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

    // 결과 고정 단계: 앞에서부터 하나씩 멈춤
    const finalResults: string[] = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 800 + i * 500));
      clearInterval(intervals[i]);
      
      // 해당 릴만 회전 멈춤
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

    calculateResult(finalResults);
    setIsSpinning(false);
    fetchProphecy();
  };

  const calculateResult = (results: string[]) => {
    const counts: Record<string, number> = {};
    results.forEach(s => counts[s] = (counts[s] || 0) + 1);
    const maxMatch = Math.max(...Object.values(counts));

    let multiplier = -1;
    let message = "꽝! 다음 기회에... (-1배)";
    let color = "text-red-500";

    if (maxMatch === 5) {
      multiplier = 10;
      message = "🎉 대박 잭팟! (+10배)";
      color = "text-yellow-400";
    } else if (maxMatch === 4) {
      multiplier = 5;
      message = "💎 놀라운 결과! (+5배)";
      color = "text-blue-400";
    } else if (maxMatch === 3) {
      multiplier = 2;
      message = "✨ 당첨되었습니다! (+2배)";
      color = "text-green-400";
    }

    const profit = betAmount * multiplier;
    const newBalance = user.balance + profit;

    onUpdateUser({ ...user, balance: newBalance });
    setGameLog({ 
      msg: `${message} ${profit > 0 ? '+' : ''}${profit.toLocaleString()}원`, 
      color 
    });

    if (newBalance <= 0) {
      alert('파산하셨습니다! 기본 자금 100만원이 충전됩니다.');
      onUpdateUser({ ...user, balance: 1000000 });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="bg-zinc-800/80 rounded-2xl p-4 border border-yellow-500/20 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <i className="fas fa-magic text-yellow-400 text-sm"></i>
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">오늘의 AI 슬롯 운세</span>
        </div>
        <p className={`text-sm italic font-medium leading-relaxed ${isAIThinking ? 'animate-pulse opacity-50' : ''}`}>
          "{prophecy}"
        </p>
      </div>

      <div className="bg-zinc-800 border-4 border-yellow-500 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400/30"></div>
        <div className="flex justify-center gap-2 mb-6 h-20">
          {reels.map((symbol, i) => (
            <div 
              key={i} 
              className={`w-14 h-20 bg-zinc-100 rounded-lg flex items-center justify-center text-3xl shadow-inner border-2 border-zinc-400 ${spinningReels[i] ? 'reel-spin' : ''}`}
            >
              {symbol}
            </div>
          ))}
        </div>

        <div className={`text-center font-black mb-6 h-6 transition-all text-sm ${gameLog.color}`}>
          {gameLog.msg}
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-black border border-zinc-700 rounded-xl py-4 px-4 text-center font-bold text-yellow-500 focus:outline-none focus:border-yellow-400"
              placeholder="배팅액"
              disabled={isSpinning}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600 font-bold">KRW</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setBetAmount(Math.floor(user.balance / 10))}
              className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-xs font-bold transition-colors"
              disabled={isSpinning}
            >
              10% 베팅
            </button>
            <button
              onClick={() => setBetAmount(user.balance)}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold transition-colors"
              disabled={isSpinning}
            >
              올인(All-in)
            </button>
          </div>

          <button
            onClick={spin}
            disabled={isSpinning}
            className={`w-full py-5 rounded-xl font-black text-xl tracking-tighter shadow-xl transform active:scale-95 transition-all ${
              isSpinning 
                ? 'bg-zinc-600 cursor-not-allowed text-zinc-400' 
                : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:brightness-110'
            }`}
          >
            {isSpinning ? '회전 중...' : '레버 당기기!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotMachine;
