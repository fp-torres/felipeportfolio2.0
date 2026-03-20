import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';

const COLORS = [
  { id: 'green',  color: 'bg-green-500',  highlight: 'bg-green-300 shadow-[0_0_30px_#4ade80]',  sound: 261.63 },
  { id: 'red',    color: 'bg-red-500',    highlight: 'bg-red-300 shadow-[0_0_30px_#f87171]',    sound: 329.63 },
  { id: 'yellow', color: 'bg-yellow-500', highlight: 'bg-yellow-300 shadow-[0_0_30px_#facc15]', sound: 392.00 },
  { id: 'blue',   color: 'bg-blue-500',   highlight: 'bg-blue-300 shadow-[0_0_30px_#60a5fa]',   sound: 523.25 },
];

export default function CyberSequence({ onBack }) {
  const { t } = useLanguage();

  const [sequence, setSequence]       = useState([]);
  const [userStep, setUserStep]       = useState(0);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [activeColor, setActiveColor] = useState(null);
  const [gameOver, setGameOver]       = useState(false);
  const [score, setScore]             = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore]     = useState(0);
  const [lives, setLives]             = useState(3);
  const [statusMsg, setStatusMsg]     = useState(''); // '' | 'correct' | 'wrong'

  // ─── AudioContext reutilizável (sem vazamento de memória) ───────────────────
  const audioCtxRef = useRef(null);
  const getAudioCtx = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    const saved = localStorage.getItem('sequenceHighScore');
    if (saved) setHighScore(parseInt(saved));
    return () => { audioCtxRef.current?.close(); };
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const playSound = (freq) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.45);
    osc.stop(ctx.currentTime + 0.45);
  };

  const flashColor = (colorObj, duration = 350) => {
    setActiveColor(colorObj.id);
    playSound(colorObj.sound);
    setTimeout(() => setActiveColor(null), duration);
  };

  // ─── Velocidade progressiva ──────────────────────────────────────────────────
  const getSpeed = (len) => Math.max(380, 820 - len * 35);

  // ─── Lógica de jogo ─────────────────────────────────────────────────────────
  const startGame = () => {
    setSequence([]);
    setUserStep(0);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setLives(3);
    setStatusMsg('');
    setTimeout(() => nextRound([]), 500);
  };

  const nextRound = (current) => {
    setIsPlaying(true);
    setUserStep(0);
    setStatusMsg('');

    const newSeq = [...current, COLORS[Math.floor(Math.random() * COLORS.length)]];
    setSequence(newSeq);

    const speed = getSpeed(newSeq.length);
    let i = 0;
    const tick = () => {
      if (i >= newSeq.length) { setIsPlaying(false); setActiveColor(null); return; }
      flashColor(newSeq[i]);
      i++;
      setTimeout(tick, speed);
    };
    setTimeout(tick, speed * 0.5);
  };

  const replaySequence = (seq) => {
    setIsPlaying(true);
    setUserStep(0);
    const speed = getSpeed(seq.length);
    let i = 0;
    const tick = () => {
      if (i >= seq.length) { setIsPlaying(false); setActiveColor(null); return; }
      flashColor(seq[i]);
      i++;
      setTimeout(tick, speed);
    };
    setTimeout(tick, speed * 0.5);
  };

  const handleUserClick = (colorObj) => {
    if (isPlaying || gameOver || !gameStarted) return;

    flashColor(colorObj, 300);

    if (colorObj.id === sequence[userStep].id) {
      // Acerto
      const next = userStep + 1;
      if (next === sequence.length) {
        // Rodada completa
        const newScore = sequence.length;
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('sequenceHighScore', newScore.toString());
        }
        setStatusMsg('correct');
        setTimeout(() => nextRound(sequence), 1100);
      } else {
        setUserStep(next);
      }
    } else {
      // Erro
      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setGameOver(true);
        setGameStarted(false);
      } else {
        setStatusMsg('wrong');
        setTimeout(() => {
          setStatusMsg('');
          replaySequence(sequence);
        }, 1000);
      }
    }
  };

  const common = t?.minigames?.common;
  const txt    = t?.minigames?.sequence;

  return (
    <div className="w-full max-w-lg mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl flex flex-col items-center">

      {/* ── Header ── */}
      <div className="w-full flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold"
        >
          <Icon icon="solar:arrow-left-bold" /> {common?.exit}
        </button>

        <div className="flex gap-3 items-center">
          {/* Vidas */}
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Icon
                key={i}
                icon="solar:heart-bold"
                className={`transition-colors duration-300 ${i < lives ? 'text-red-500' : 'text-gray-700'}`}
              />
            ))}
          </div>
          <div className="text-primary font-mono font-bold bg-black/20 px-3 py-1 rounded">
            {common?.score}: {score}
          </div>
          <div className="text-white/50 font-mono font-bold border border-white/10 px-3 py-1 rounded">
            {common?.record}: {highScore}
          </div>
        </div>
      </div>

      {/* ── Grid de cores ── */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 grid grid-cols-2 gap-4 mb-8">
        {COLORS.map((btn) => (
          <button
            key={btn.id}
            onPointerDown={() => handleUserClick(btn)}   // ← sem delay mobile
            className={`
              w-full h-full rounded-2xl transition-all duration-100 border-4 border-black/20
              ${btn.color}
              ${activeColor === btn.id
                ? btn.highlight + ' scale-95'
                : 'opacity-80 hover:opacity-100'}
            `}
            disabled={isPlaying || gameOver}
          />
        ))}

        {/* Botão central – mostra número da rodada */}
        <div className="absolute inset-0 m-auto w-20 h-20 bg-[#0F172A] rounded-full border-4 border-surface shadow-2xl flex flex-col items-center justify-center z-10 select-none">
          {gameStarted && !gameOver ? (
            <>
              <span className="text-white font-bold text-2xl leading-none">{sequence.length}</span>
              <span className="text-white/30 text-[9px] font-mono leading-none mt-0.5">fase</span>
            </>
          ) : (
            <div className={`w-4 h-4 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
          )}
        </div>
      </div>

      {/* ── Mensagem de status ── */}
      <div className="h-16 flex items-center justify-center w-full">
        {!gameStarted && !gameOver && (
          <button
            onPointerDown={startGame}
            className="bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg animate-bounce"
          >
            <Icon icon="solar:play-bold" /> Iniciar
          </button>
        )}

        {isPlaying && (
          <span className="text-white font-mono text-lg animate-pulse">{txt?.watch}</span>
        )}

        {!isPlaying && statusMsg === 'correct' && (
          <span className="text-green-400 font-mono text-lg animate-in fade-in">
            ✓ Fase {score} completa!
          </span>
        )}

        {!isPlaying && statusMsg === 'wrong' && (
          <span className="text-red-400 font-mono text-lg animate-in fade-in">
            ✗ Errou! {lives} vida{lives !== 1 ? 's' : ''} restante{lives !== 1 ? 's' : ''}
          </span>
        )}

        {gameStarted && !isPlaying && !gameOver && statusMsg === '' && (
          <span className="text-primary font-mono text-lg">{txt?.turn}</span>
        )}

        {gameOver && (
          <div className="text-center animate-in fade-in zoom-in">
            <p className="text-red-500 font-bold text-xl mb-2">{txt?.wrong}</p>
            <button
              onPointerDown={startGame}
              className="bg-white/10 text-white border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-bg transition-colors"
            >
              {common?.tryAgain}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}