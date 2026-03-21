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
  const common = t?.minigames?.common;
  const txt    = t?.minigames?.sequence;

  const [sequence,    setSequence]    = useState([]);
  const [userStep,    setUserStep]    = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [activeColor, setActiveColor] = useState(null);
  const [gameOver,    setGameOver]    = useState(false);
  const [score,       setScore]       = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore,   setHighScore]   = useState(0);
  const [lives,       setLives]       = useState(3);
  const [statusMsg,   setStatusMsg]   = useState('');

  // ── AudioContext – single instance, warmed-up on first interaction ──────────
  const audioCtxRef = useRef(null);

  const getAudioCtx = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  };

  // Pre-warm the AudioContext on first user gesture to eliminate mobile latency
  const warmAudio = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    // Play a silent buffer to unlock the context immediately
    const buf  = ctx.createBuffer(1, 1, 22050);
    const src  = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  };

  useEffect(() => {
    const saved = localStorage.getItem('sequenceHighScore');
    if (saved) setHighScore(parseInt(saved));
    return () => { audioCtxRef.current?.close(); };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const playSound = (freq) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    // Always resume before scheduling – critical on iOS/Android
    const schedule = () => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.42);
      osc.stop(ctx.currentTime + 0.42);
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(schedule);
    } else {
      schedule();
    }
  };

  const flashColor = (colorObj, duration = 350) => {
    setActiveColor(colorObj.id);
    playSound(colorObj.sound);
    setTimeout(() => setActiveColor(null), duration);
  };

  const getSpeed = (len) => Math.max(380, 820 - len * 35);

  // ── Game logic ───────────────────────────────────────────────────────────────
  const startGame = () => {
    warmAudio(); // unlock on the user gesture that starts the game
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

    const newSeq  = [...current, COLORS[Math.floor(Math.random() * COLORS.length)]];
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
      const next = userStep + 1;
      if (next === sequence.length) {
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

  // ── Build status messages from translations with fallbacks ──────────────────
  const phaseCompleteMsg = txt?.phaseComplete
    ? txt.phaseComplete.replace('{n}', score)
    : `✓ Round ${score} complete!`;

  const livesLeftMsg = (() => {
    if (txt?.livesLeft) {
      const word = lives !== 1 ? (txt?.lives ?? 'lives') : (txt?.life ?? 'life');
      return txt.livesLeft.replace('{n}', lives).replace('{life}', word);
    }
    return `✗ Wrong! ${lives} ${lives !== 1 ? 'lives' : 'life'} remaining`;
  })();

  return (
    <div className="w-full max-w-lg mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-4 sm:p-6 shadow-2xl flex flex-col items-center">

      {/* ── Title Banner ── */}
      <div className="mb-4 w-full text-center">
        <div className="inline-flex items-center gap-2 bg-black/30 border border-white/10 rounded-full px-4 py-1.5">
          <Icon icon="solar:palette-round-bold" className="text-primary text-sm" />
          <span className="text-sm font-bold text-white tracking-wider">{txt?.title ?? 'Cyber Sequence'}</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="w-full flex flex-wrap justify-between items-center gap-2 mb-6">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white flex items-center gap-1.5 text-sm font-bold transition-colors"
        >
          <Icon icon="solar:arrow-left-bold" /> {common?.exit ?? 'Exit'}
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Lives */}
          <div className="flex gap-1 items-center">
            {[...Array(3)].map((_, i) => (
              <Icon
                key={i}
                icon="solar:heart-bold"
                className={`text-base transition-colors duration-300 ${i < lives ? 'text-red-500' : 'text-gray-700'}`}
              />
            ))}
          </div>

          {/* Score badge */}
          <div className="text-primary font-mono font-bold bg-black/25 px-2.5 py-1 rounded-lg border border-primary/20 text-xs whitespace-nowrap">
            {common?.score ?? 'Score'}: <span className="text-sm">{score}</span>
          </div>

          {/* Record badge */}
          <div className="text-white/60 font-mono font-bold border border-white/10 bg-black/20 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap">
            <Icon icon="solar:cup-star-bold" className="inline mr-1 text-yellow-500/60" />
            {highScore}
          </div>
        </div>
      </div>

      {/* ── Color Grid ── */}
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square grid grid-cols-2 gap-3 mb-6">
        {COLORS.map((btn) => (
          <button
            key={btn.id}
            onPointerDown={() => handleUserClick(btn)}
            className={`
              w-full h-full rounded-2xl transition-all duration-100 border-4 border-black/20
              ${btn.color}
              ${activeColor === btn.id
                ? btn.highlight + ' scale-95'
                : 'opacity-80 hover:opacity-100 active:scale-95'}
            `}
            disabled={isPlaying || gameOver}
          />
        ))}

        {/* Center ring */}
        <div className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 bg-[#0F172A] rounded-full border-4 border-surface shadow-2xl flex flex-col items-center justify-center z-10 select-none pointer-events-none">
          {gameStarted && !gameOver ? (
            <>
              <span className="text-white font-bold text-xl sm:text-2xl leading-none">{sequence.length}</span>
              <span className="text-white/30 text-[9px] font-mono leading-none mt-0.5">
                {txt?.phaseLabel ?? 'round'}
              </span>
            </>
          ) : (
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
          )}
        </div>
      </div>

      {/* ── Status / Actions ── */}
      <div className="min-h-[72px] flex items-center justify-center w-full">
        {!gameStarted && !gameOver && (
          <button
            onPointerDown={startGame}
            className="bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg animate-bounce"
          >
            <Icon icon="solar:play-bold" /> {txt?.start ?? 'Start'}
          </button>
        )}

        {isPlaying && (
          <span className="text-white font-mono text-base sm:text-lg animate-pulse flex items-center gap-2">
            <Icon icon="solar:eye-bold" className="text-primary" />
            {txt?.watch ?? 'Watch...'}
          </span>
        )}

        {!isPlaying && statusMsg === 'correct' && (
          <span className="text-green-400 font-mono text-base sm:text-lg animate-in fade-in">
            {phaseCompleteMsg}
          </span>
        )}

        {!isPlaying && statusMsg === 'wrong' && (
          <span className="text-red-400 font-mono text-sm sm:text-base animate-in fade-in text-center">
            {livesLeftMsg}
          </span>
        )}

        {gameStarted && !isPlaying && !gameOver && statusMsg === '' && (
          <span className="text-primary font-mono text-base sm:text-lg font-semibold">
            {txt?.turn ?? 'Your turn!'}
          </span>
        )}

        {gameOver && (
          <div className="text-center animate-in fade-in zoom-in">
            <p className="text-red-500 font-bold text-lg sm:text-xl mb-3">
              {txt?.wrong ?? 'Wrong!'}
            </p>
            <button
              onPointerDown={startGame}
              className="bg-white/10 text-white border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-bg transition-colors"
            >
              {common?.tryAgain ?? 'Try Again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}