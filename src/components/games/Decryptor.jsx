import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_SYMBOLS = [
  { id: 'A', icon: 'solar:code-circle-bold',        color: 'text-green-400'   },
  { id: 'B', icon: 'solar:shield-warning-bold',      color: 'text-red-400'    },
  { id: 'C', icon: 'solar:cpu-bolt-bold',            color: 'text-blue-400'   },
  { id: 'D', icon: 'solar:wi-fi-router-bold',        color: 'text-yellow-400' },
  { id: 'E', icon: 'solar:database-bold',            color: 'text-purple-400' },
  { id: 'F', icon: 'solar:lock-password-bold',       color: 'text-orange-400' },
  { id: 'G', icon: 'solar:bug-bold',                 color: 'text-pink-400'   },
  { id: 'H', icon: 'solar:server-bold',              color: 'text-cyan-400'   },
  { id: 'I', icon: 'solar:key-bold',                 color: 'text-lime-400'   },
  { id: 'J', icon: 'solar:fire-bold',                color: 'text-rose-400'   },
];

const getLevelConfig = (level) => {
  if (level === 1)  return { slots: 3, options: 4,  tries: 8  };
  if (level === 2)  return { slots: 4, options: 5,  tries: 10 };
  if (level === 3)  return { slots: 4, options: 6,  tries: 10 };
  if (level === 4)  return { slots: 5, options: 6,  tries: 12 };
  if (level === 5)  return { slots: 5, options: 7,  tries: 11 };
  if (level === 6)  return { slots: 5, options: 8,  tries: 10 };
  if (level === 7)  return { slots: 6, options: 8,  tries: 12 };
  if (level === 8)  return { slots: 6, options: 9,  tries: 11 };
  if (level === 9)  return { slots: 6, options: 9,  tries: 10 };
  return {
    slots:   6,
    options: 10,
    tries:   Math.max(7, 10 - Math.floor((level - 10) / 2)),
  };
};

const keyboardCols = (optCount) => {
  if (optCount <= 4) return 4;
  if (optCount <= 6) return 6;
  return 5;
};

// ── Defined OUTSIDE Decryptor so its reference is stable across renders ──
const GuessRow = ({ turn, slotCount, compact = false, txt }) => {
  if (turn.isHint) {
    return (
      <div className="flex items-center gap-2 text-yellow-400 text-xs w-full flex-wrap bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg">
        <Icon icon="solar:eye-bold" />
        <span>{txt?.hintRow ?? 'Hint: position'} {turn.hintReveal.index + 1} =</span>
        <div className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} rounded bg-black/40 flex items-center justify-center`}>
          <Icon icon={turn.hintReveal.symbol.icon} className={turn.hintReveal.symbol.color} />
        </div>
        <span className="ml-auto text-yellow-600 text-[10px]">−1 attempt</span>
      </div>
    );
  }
  const iconSz = compact ? 'w-6 h-6' : 'w-8 h-8 sm:w-9 sm:h-9';
  return (
    <div className={`flex items-center justify-between ${compact ? 'p-1.5' : 'p-2'} bg-white/5 rounded-lg border border-white/5`}>
      <div className={`flex ${compact ? 'gap-1' : 'gap-1 sm:gap-2'}`}>
        {turn.guess.map((s, i) => (
          <div key={i} className={`${iconSz} rounded bg-black/40 flex items-center justify-center shrink-0`}>
            <Icon icon={s.icon} className={`${s.color} ${compact ? 'text-xs' : 'text-sm sm:text-base'}`} />
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 ml-2 flex-wrap justify-end max-w-[52px] shrink-0">
        {[...Array(turn.exact)].map((_, i) =>
          <div key={`e${i}`} className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_4px_#22c55e]" />
        )}
        {[...Array(turn.partial)].map((_, i) =>
          <div key={`p${i}`} className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_4px_#eab308]" />
        )}
        {[...Array(slotCount - turn.exact - turn.partial)].map((_, i) =>
          <div key={`w${i}`} className="w-2.5 h-2.5 rounded-full bg-gray-700" />
        )}
      </div>
    </div>
  );
};

export default function Decryptor({ onBack }) {
  const { t } = useLanguage();
  const common = t?.minigames?.common;
  const txt    = t?.minigames?.decryptor;

  const [level,        setLevel]        = useState(1);
  const [secretCode,   setSecretCode]   = useState([]);
  const [guesses,      setGuesses]      = useState([]);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [gameStatus,   setGameStatus]   = useState('playing');
  const [highScore,    setHighScore]    = useState(1);
  const [hintUsed,     setHintUsed]     = useState(false);
  const [hintReveal,   setHintReveal]   = useState(null);

  const scrollRef  = useRef(null);
  const historyRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('decryptorRecord');
    if (saved) setHighScore(parseInt(saved));
    startLevel(1);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [guesses, currentGuess]);

  const startLevel = (lvl) => {
    const config  = getLevelConfig(lvl);
    const pool    = ALL_SYMBOLS.slice(0, config.options);
    const newCode = Array.from({ length: config.slots }, () =>
      pool[Math.floor(Math.random() * pool.length)]
    );
    setSecretCode(newCode);
    setGuesses([]);
    setCurrentGuess([]);
    setGameStatus('playing');
    setLevel(lvl);
    setHintUsed(false);
    setHintReveal(null);
  };

  const handleSelectSymbol = (symbol) => {
    if (gameStatus !== 'playing') return;
    const config = getLevelConfig(level);
    if (currentGuess.length < config.slots)
      setCurrentGuess(prev => [...prev, symbol]);
  };

  const handleBackspace = () => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const handleHint = () => {
    if (gameStatus !== 'playing' || hintUsed) return;
    const config = getLevelConfig(level);
    if (guesses.length + 1 >= config.tries) return;
    setHintUsed(true);
    let revealIdx = 0;
    for (let i = 0; i < config.slots; i++) {
      const alreadyExact = guesses.some(g => !g.isHint && g.guess[i]?.id === secretCode[i]?.id);
      if (!alreadyExact) { revealIdx = i; break; }
    }
    const revealed = { index: revealIdx, symbol: secretCode[revealIdx] };
    setHintReveal(revealed);
    setGuesses(prev => [
      ...prev,
      { isHint: true, hintReveal: revealed, guess: [], exact: 0, partial: 0 },
    ]);
  };

  const handleSubmit = () => {
    if (gameStatus !== 'playing') return;
    const config = getLevelConfig(level);
    if (currentGuess.length !== config.slots) return;
    let exact = 0, partial = 0;
    const tempSecret = [...secretCode];
    const tempGuess  = [...currentGuess];
    for (let i = 0; i < config.slots; i++) {
      if (tempGuess[i].id === tempSecret[i].id) {
        exact++;
        tempSecret[i] = null;
        tempGuess[i]  = 'MATCHED';
      }
    }
    for (let i = 0; i < config.slots; i++) {
      if (tempGuess[i] === 'MATCHED') continue;
      const fi = tempSecret.findIndex(s => s && s.id === tempGuess[i].id);
      if (fi !== -1) { partial++; tempSecret[fi] = null; }
    }
    const newHistory = [...guesses, { guess: currentGuess, exact, partial }];
    setGuesses(newHistory);
    setCurrentGuess([]);
    if (exact === config.slots) {
      setGameStatus('won');
      if (level >= highScore) {
        const next = level + 1;
        setHighScore(next);
        localStorage.setItem('decryptorRecord', next.toString());
      }
    } else if (newHistory.filter(g => !g.isHint).length >= config.tries) {
      setGameStatus('lost');
    }
  };

  const config      = getLevelConfig(level);
  const currentOpts = ALL_SYMBOLS.slice(0, config.options);
  const isRowFull   = currentGuess.length === config.slots;
  const realGuesses  = guesses.filter(g => !g.isHint);
  const attemptsUsed = realGuesses.length;
  const progressPct  = Math.min((attemptsUsed / config.tries) * 100, 100);
  const progressColor =
    progressPct > 75 ? 'bg-red-500' :
    progressPct > 50 ? 'bg-yellow-500' : 'bg-green-500';
  const cols = keyboardCols(config.options);

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0F172A] rounded-3xl border border-white/10 p-3 sm:p-4 shadow-2xl relative flex flex-col h-[85vh] max-h-[720px]">

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2 shrink-0">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white flex items-center gap-1.5 text-sm font-bold transition-colors"
        >
          <Icon icon="solar:arrow-left-bold" /> {common?.exit ?? 'Exit'}
        </button>

        <div className="flex gap-2 items-center flex-wrap justify-end">
          <button
            onPointerDown={(e) => { e.preventDefault(); handleHint(); }}
            disabled={hintUsed || gameStatus !== 'playing'}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-all touch-none ${
              hintUsed || gameStatus !== 'playing'
                ? 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed'
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
            }`}
          >
            <Icon icon="solar:eye-bold" />
            {hintUsed ? (txt?.hintUsed ?? 'Used') : (txt?.hint ?? 'Hint')}
          </button>

          <div className="font-mono text-xs text-purple-300 bg-purple-500/20 px-3 py-1 rounded-lg border border-purple-500/30 whitespace-nowrap">
            {common?.level ?? 'Level'} {level}
          </div>

          <div className="font-mono text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-lg border border-white/10 whitespace-nowrap">
            {common?.max ?? 'Max'}: {highScore}
          </div>
        </div>
      </div>

      {/* ── Title Banner ── */}
      <div className="text-center mb-2 shrink-0">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
          <Icon icon="solar:lock-password-bold" className="text-primary text-xs" />
          <span className="text-xs font-bold text-white tracking-wider">{txt?.title ?? 'Decryptor'}</span>
          <span className="text-[10px] text-gray-500 font-mono">
            {config.slots}×{config.options} · {config.tries} {txt?.tries ?? 'tries'}
          </span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex justify-center gap-4 mb-2 text-[10px] text-gray-400 bg-black/20 py-1.5 rounded-lg shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
          <span>{txt?.exactMatch ?? 'Correct Position'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_#eab308]" />
          <span>{txt?.partialMatch ?? 'Right Symbol, Wrong Spot'}</span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="w-full bg-white/5 rounded-full h-1.5 mb-1 shrink-0 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 font-mono mb-1 shrink-0 px-0.5">
        <span>{attemptsUsed} / {config.tries} {txt?.tries ?? 'tries'}</span>
        <span>{config.tries - attemptsUsed} {txt?.remaining ?? 'left'}</span>
      </div>

      {/* ── History ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 mb-2 pr-0.5 bg-black/20 rounded-xl p-2 border border-white/5 min-h-0"
      >
        {guesses.length === 0 && gameStatus === 'playing' && (
          <div className="text-center text-gray-500 text-xs mt-10 opacity-50 px-4">
            {txt?.placeholder ?? 'Select icons below to guess the password.'}
          </div>
        )}

        {guesses.map((turn, idx) => (
          <GuessRow key={idx} turn={turn} slotCount={config.slots} txt={txt} />
        ))}

        {gameStatus === 'playing' && (
          <div className="flex items-center justify-between bg-primary/10 p-2 rounded-lg border border-primary/30">
            <div className="flex gap-1 sm:gap-2">
              {[...Array(config.slots)].map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded bg-black/40 flex items-center justify-center border transition-colors ${
                    currentGuess[i] ? 'border-white/20' : 'border-primary/30'
                  }`}
                >
                  {currentGuess[i] ? (
                    <Icon icon={currentGuess[i].icon} className={currentGuess[i].color} />
                  ) : i === currentGuess.length ? (
                    <span className="w-0.5 h-4 bg-primary animate-pulse rounded-full" />
                  ) : (
                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                  )}
                </div>
              ))}
            </div>
            <div className="text-xs text-primary font-bold font-mono whitespace-nowrap ml-2">
              {attemptsUsed + 1}/{config.tries}
            </div>
          </div>
        )}
      </div>

      {/* ── End-game overlay ── */}
      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-sm bg-[#1e293b] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {gameStatus === 'won' ? (
                <div className="p-6 text-center">
                  <Icon icon="solar:lock-unlocked-bold" className="text-green-400 text-5xl mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {txt?.accessGranted ?? 'ACCESS GRANTED!'}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    {txt?.cracked ?? 'You cracked the encryption.'}
                  </p>
                  <div className="flex justify-center gap-2 mb-3 bg-black/30 p-2 rounded-lg">
                    {secretCode.map((s, i) => (
                      <Icon key={i} icon={s.icon} className={s.color} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mb-4 font-mono">
                    {attemptsUsed} {txt?.attemptsUsed ?? 'attempts used'} · {txt?.nextChallenge ?? 'Next challenge unlocked'}
                  </p>
                  <button
                    onClick={() => startLevel(level + 1)}
                    className="w-full bg-green-500 text-black font-bold py-3 rounded-xl hover:bg-green-400 transition-colors"
                  >
                    {common?.nextLevel ?? 'Next Level'} →
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 pb-2 text-center shrink-0">
                    <Icon icon="solar:shield-warning-bold" className="text-red-500 text-4xl mx-auto mb-1" />
                    <h3 className="text-xl font-bold text-white mb-1">
                      {txt?.accessDenied ?? 'ACCESS DENIED'}
                    </h3>
                    <p className="text-gray-500 text-xs mb-2">
                      {txt?.codeWas ?? 'The code was:'}
                    </p>
                    <div className="flex justify-center gap-1.5 mb-1 bg-black/30 p-2 rounded-lg">
                      {secretCode.map((s, i) => (
                        <div key={i} className="w-8 h-8 rounded bg-black/50 flex items-center justify-center border border-white/10">
                          <Icon icon={s.icon} className={s.color} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mx-4 mb-1.5 shrink-0">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                      {txt?.allAttempts ?? 'All attempts'}
                      <span className="ml-2 text-gray-600">({realGuesses.length})</span>
                    </p>
                  </div>

                  <div
                    ref={historyRef}
                    className="overflow-y-auto flex-1 px-4 pb-2 space-y-1 min-h-0"
                    style={{ maxHeight: '260px' }}
                  >
                    {guesses.map((turn, idx) => (
                      <GuessRow key={idx} turn={turn} slotCount={config.slots} compact txt={txt} />
                    ))}
                  </div>

                  <div className="p-4 pt-2 shrink-0">
                    <button
                      onClick={() => startLevel(level)}
                      className="w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      {common?.tryAgain ?? 'Try Again'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Keyboard ── */}
      <div className="shrink-0 pt-2 border-t border-white/5 space-y-2">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {currentOpts.map((symbol) => (
            <button
              key={symbol.id}
              onPointerDown={(e) => { e.preventDefault(); handleSelectSymbol(symbol); }}
              disabled={gameStatus !== 'playing'}
              className="bg-black/30 hover:bg-white/10 p-2.5 sm:p-3 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 touch-none"
            >
              <Icon icon={symbol.icon} className={`${symbol.color} text-xl sm:text-2xl`} />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            onPointerDown={(e) => { e.preventDefault(); handleBackspace(); }}
            disabled={gameStatus !== 'playing'}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl py-3 flex items-center justify-center active:scale-95 touch-none gap-1.5 text-sm font-medium disabled:opacity-40"
          >
            <Icon icon="solar:backspace-bold" className="text-xl" />
          </button>

          <button
            onPointerDown={(e) => { e.preventDefault(); handleSubmit(); }}
            disabled={gameStatus !== 'playing' || !isRowFull}
            className={`rounded-xl py-3 flex items-center justify-center active:scale-95 font-bold transition-all touch-none ${
              isRowFull && gameStatus === 'playing'
                ? 'bg-primary text-bg hover:bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {txt?.enter ?? 'ENTER'}
          </button>
        </div>
      </div>
    </div>
  );
}