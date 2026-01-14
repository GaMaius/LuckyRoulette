
import React, { useState, useEffect, useCallback } from 'react';
import { User, SLOT_SYMBOLS } from '../types';
import { api } from '../services/apiService';

interface SlotMachineProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const LOCAL_FORTUNES = [
  "오늘 당신의 운명은 다이아몬드처럼 빛납니다.",
  "조금만 더 버티세요. 거대한 파도가 오고 있습니다.",
  "운은 용기 있는 자의 편입니다. 과감하게 배팅하세요.",
  "침묵 뒤에 승리가 기다리고 있습니다.",
  "오늘은 올인하기에 가장 완벽한 날입니다.",
  "지갑이 무거워질 준비를 하세요.",
  "잭팟의 향기가 여기까지 느껴지는군요.",
  "실패는 더 큰 성공을 위한 배팅일 뿐입니다."
];

const SlotMachine: React.FC<SlotMachineProps> = ({ user, onUpdateUser }) => {
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣', '7️⃣', '7️⃣']);
  const [betAmount, setBetAmount] = useState<number>(100000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const [gameLog, setGameLog] = useState<{ msg: string; color: string }>({ msg: 'PLACE YOUR BET & SPIN', color: 'text-zinc-500' });
  const [prophecy, setProphecy] = useState<string>('');
  const [liveActivity, setLiveActivity] = useState<string>("SYSTEM STANDBY");

  const updateFortune = useCallback(() => {
    const randomFortune = LOCAL_FORTUNES[Math.floor(Math.random() * LOCAL_FORTUNES.length)];
    setProphecy(randomFortune);
  }, []);

  useEffect(() => {
    updateFortune();
    api.subscribeEvents((newEvent) => {
      setLiveActivity(newEvent.toUpperCase());
    });
  }, [user.id, updateFortune]);

  const spin = async () => {
    if (isSpinning) return;
    if (betAmount <= 0) return alert('Enter a valid bet amount.');
    if (betAmount > user.balance) return alert('Insufficient balance.');

    setIsSpinning(true);
    setSpinningReels([true, true, true, true, true]);
    setGameLog({ msg: 'REELS SPINNING...', color: 'text-amber-500 animate-pulse' });

    const intervals: any[] = [];
    [0, 1, 2, 3, 4].forEach((idx) => {
      const interval = setInterval(() => {
        setReels(prev => {
          const next = [...prev];
          next[idx] = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
          return next;
        });
      }, 70);
      intervals.push(interval);
    });

    const finalResults: string[] = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 500 + i * 350));
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
    updateFortune();
  };

  const calculateResult = async (results: string[]) => {
    const counts: Record<string, number> = {};
    results.forEach(s => counts[s] = (counts[s] || 0) + 1);
    const maxMatch = Math.max(...Object.values(counts));

    let multiplier = -1;
    let message = "NO MATCH (-1x)";
    let color = "text-rose-500";

    if (maxMatch === 5) { 
      multiplier = 20; 
      message = "🏆 JACKPOT EXPLOSION! (20x)"; 
      color = "text-amber-400 animate-bounce";
      await api.logEvent(`💰 JACKPOT! ${user.nick} WON ${(betAmount * 20).toLocaleString()}!`);
    }
    else if (maxMatch === 4) { 
      multiplier = 8; 
      message = "💎 MEGA WIN! (8x)"; 
      color = "text-blue-400";
      await api.logEvent(`💎 MEGA! ${user.nick} WON ${(betAmount * 8).toLocaleString()}!`);
    }
    else if (maxMatch === 3) { 
      multiplier = 3; 
      message = "✨ BIG WIN! (3x)"; 
      color = "text-emerald-400"; 
    }

    const profit = betAmount * multiplier;
    const nextBalance = user.balance + profit;
    
    onUpdateUser({ ...user, balance: nextBalance });
    setGameLog({ msg: `${message} | ${profit > 0 ? '+' : ''}${profit.toLocaleString()}`, color });

    if (nextBalance <= 0) {
      alert('You went bankrupt! System will recharge 1,000,000.');
      onUpdateUser({ ...user, balance: 1000000 });
      await api.logEvent(`💸 ${user.nick} went bankrupt and received support.`);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Live Activity Ticker */}
      <div className="glass border border-white/5 py-3 px-5 rounded-2xl flex items-center gap-3 shadow-inner overflow-hidden">
        <span className="flex-shrink-0 text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md font-black animate-pulse tracking-tighter">LIVE</span>
        <div className="flex-1 overflow-hidden">
          <p className="text-[11px] font-black text-rose-500 italic tracking-tight whitespace-nowrap animate-pulse">
            {liveActivity}
          </p>
        </div>
      </div>

      {/* Oracle Message */}
      <div className="glass rounded-[2rem] p-6 border border-amber-500/20 shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <i className="fas fa-hat-wizard text-[120px] text-amber-500"></i>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <i className="fas fa-sparkles text-amber-500 text-xs"></i>
          <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.3em]">Fortune Oracle</span>
        </div>
        <p className="text-base italic font-bold leading-relaxed text-zinc-100 pr-4 relative z-10 drop-shadow">
          "{prophecy}"
        </p>
      </div>

      {/* Main Machine UI */}
      <div className="bg-zinc-900 border-[8px] border-zinc-800 rounded-[3rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative overflow-hidden border-t-zinc-700/50">
        {/* Reels Container */}
        <div className="flex justify-center gap-2.5 mb-10 p-4 bg-black/60 rounded-[2rem] shadow-inner border border-white/5">
          {reels.map((symbol, i) => (
            <div 
              key={i} 
              className={`w-14 sm:w-16 h-24 bg-gradient-to-b from-zinc-100 to-zinc-300 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border-t border-white transition-all ${spinningReels[i] ? 'reel-spin' : ''}`}
            >
              <span className="drop-shadow-md">{symbol}</span>
            </div>
          ))}
        </div>

        {/* Display Panel */}
        <div className={`text-center font-black mb-8 h-8 transition-all text-sm tracking-tighter uppercase drop-shadow-md ${gameLog.color}`}>
          {gameLog.msg}
        </div>

        {/* Interaction Panel */}
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="text-zinc-600 font-black text-sm">₩</span>
            </div>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-black border-2 border-zinc-800 rounded-[1.5rem] py-5 pl-10 pr-6 text-center font-black text-amber-500 text-2xl focus:outline-none focus:border-amber-500/50 transition-all shadow-inner group-hover:bg-zinc-950"
              disabled={isSpinning}
            />
          </div>
          
          <div className="flex gap-3">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setBetAmount(Math.floor(user.balance * (pct / 100)))}
                className="flex-1 py-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-[9px] font-black transition-all border border-white/5 active:scale-95"
                disabled={isSpinning}
              >
                {pct === 100 ? 'MAX' : `${pct}%`}
              </button>
            ))}
          </div>

          <button
            onClick={spin}
            disabled={isSpinning}
            className={`w-full py-6 rounded-[1.5rem] font-black text-xl italic shadow-[0_15px_30px_rgba(0,0,0,0.4)] active:scale-95 transition-all relative overflow-hidden group ${
              isSpinning 
                ? 'bg-zinc-800 text-zinc-600' 
                : 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-zinc-950 hover:brightness-110 gold-glow'
            }`}
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"></div>
            {isSpinning ? 'PROCESSING...' : '🎰 SPIN TO WIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotMachine;
