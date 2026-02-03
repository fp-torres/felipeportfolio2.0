import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

const COLORS = [
  { id: 'green', color: 'bg-green-500', highlight: 'bg-green-300 shadow-[0_0_30px_#4ade80]', sound: 261.63 },
  { id: 'red', color: 'bg-red-500', highlight: 'bg-red-300 shadow-[0_0_30px_#f87171]', sound: 329.63 },
  { id: 'yellow', color: 'bg-yellow-500', highlight: 'bg-yellow-300 shadow-[0_0_30px_#facc15]', sound: 392.00 },
  { id: 'blue', color: 'bg-blue-500', highlight: 'bg-blue-300 shadow-[0_0_30px_#60a5fa]', sound: 523.25 }
];

export default function CyberSequence({ onBack }) {
  const { t } = useLanguage();
  
  const [sequence, setSequence] = useState([]);
  const [userStep, setUserStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeColor, setActiveColor] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('sequenceHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const startGame = () => {
    setSequence([]);
    setUserStep(0);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setTimeout(() => nextRound([]), 500);
  };

  const nextRound = (currentSequence) => {
    setIsPlaying(true);
    setUserStep(0);
    
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSequence = [...currentSequence, randomColor];
    setSequence(newSequence);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= newSequence.length) {
        clearInterval(interval);
        setIsPlaying(false);
        setActiveColor(null);
        return;
      }
      flashColor(newSequence[i]);
      i++;
    }, 800);
  };

  const flashColor = (colorObj) => {
    setActiveColor(colorObj.id);
    playSound(colorObj.sound);
    setTimeout(() => {
      setActiveColor(null);
    }, 400);
  };

  const handleUserClick = (colorObj) => {
    if (isPlaying || gameOver || !gameStarted) return;

    flashColor(colorObj);

    if (colorObj.id === sequence[userStep].id) {
      const nextStep = userStep + 1;
      if (nextStep === sequence.length) {
        setScore(sequence.length);
        if (sequence.length > highScore) {
            setHighScore(sequence.length);
            localStorage.setItem('sequenceHighScore', sequence.length.toString());
        }
        setTimeout(() => nextRound(sequence), 1000);
      } else {
        setUserStep(nextStep);
      }
    } else {
      setGameOver(true);
      setGameStarted(false);
    }
  };

  const playSound = (freq) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = freq;
    osc.type = 'sine';
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  };

  const common = t?.minigames?.common;
  const txt = t?.minigames?.sequence;

  return (
    <div className="w-full max-w-lg mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl flex flex-col items-center">
      
      <div className="w-full flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold">
          <Icon icon="solar:arrow-left-bold" /> {common?.exit}
        </button>
        <div className="flex gap-4">
             <div className="text-primary font-mono font-bold bg-black/20 px-3 py-1 rounded">{common?.score}: {score}</div>
             <div className="text-white/50 font-mono font-bold border border-white/10 px-3 py-1 rounded">{common?.record}: {highScore}</div>
        </div>
      </div>

      <div className="relative w-64 h-64 sm:w-80 sm:h-80 grid grid-cols-2 gap-4 mb-8">
        {COLORS.map((btn) => (
          <button
            key={btn.id}
            onClick={() => handleUserClick(btn)}
            className={`
              w-full h-full rounded-2xl transition-all duration-100 border-4 border-black/20
              ${btn.color}
              ${activeColor === btn.id ? btn.highlight + ' scale-95' : 'opacity-80 hover:opacity-100'}
            `}
            disabled={isPlaying || gameOver}
          />
        ))}
        
        <div className="absolute inset-0 m-auto w-20 h-20 bg-[#0F172A] rounded-full border-4 border-surface shadow-2xl flex items-center justify-center z-10">
            <div className={`w-4 h-4 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
        </div>
      </div>

      <div className="h-16 flex items-center justify-center w-full">
        {!gameStarted && !gameOver && (
            <button onClick={startGame} className="bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg animate-bounce">
                <Icon icon="solar:play-bold" /> {t?.minigames?.common?.playAgain?.replace('Novamente', '') || "Start"}
            </button>
        )}

        {isPlaying && (
            <span className="text-white font-mono text-lg animate-pulse">{txt?.watch}</span>
        )}

        {gameStarted && !isPlaying && !gameOver && (
            <span className="text-primary font-mono text-lg">{txt?.turn}</span>
        )}

        {gameOver && (
            <div className="text-center animate-in fade-in zoom-in">
                <p className="text-red-500 font-bold text-xl mb-2">{txt?.wrong}</p>
                <button onClick={startGame} className="bg-white/10 text-white border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-bg transition-colors">
                    {common?.tryAgain}
                </button>
            </div>
        )}
      </div>

    </div>
  );
}