import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const allTechIcons = [
  { id: 1,  icon: 'devicon:react',       name: 'React'  },
  { id: 2,  icon: 'devicon:python',      name: 'Python' },
  { id: 3,  icon: 'devicon:javascript',  name: 'JS'     },
  { id: 4,  icon: 'devicon:typescript',  name: 'TS'     },
  { id: 5,  icon: 'devicon:linux',       name: 'Linux'  },
  { id: 6,  icon: 'devicon:docker',      name: 'Docker' },
  { id: 7,  icon: 'devicon:mysql',       name: 'MySQL'  },
  { id: 8,  icon: 'devicon:git',         name: 'Git'    },
  { id: 9,  icon: 'devicon:nodejs',      name: 'Node'   },
  { id: 10, icon: 'devicon:php',         name: 'PHP'    },
  { id: 11, icon: 'devicon:java',        name: 'Java'   },
  { id: 12, icon: 'devicon:html5',       name: 'HTML'   },
];

const DIFFICULTY_CONFIG = {
  easy:   { pairs: 6,  cols: 'grid-cols-3 sm:grid-cols-4', cardSize: 'w-16 h-16 sm:w-20 sm:h-20' },
  medium: { pairs: 8,  cols: 'grid-cols-4',                cardSize: 'w-14 h-14 sm:w-18 sm:h-18' },
  hard:   { pairs: 12, cols: 'grid-cols-4 sm:grid-cols-6', cardSize: 'w-12 h-12 sm:w-16 sm:h-16' },
};

export default function TechMemoryGame({ onBack }) {
  const { t } = useLanguage();
  const txt    = t?.minigames?.memory;
  const common = t?.minigames?.common;

  const [cards,       setCards]       = useState([]);
  const [flipped,     setFlipped]     = useState([]);
  const [solved,      setSolved]      = useState([]);
  const [disabled,    setDisabled]    = useState(false);
  const [moves,       setMoves]       = useState(0);
  const [won,         setWon]         = useState(false);
  const [gameActive,  setGameActive]  = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [difficulty,  setDifficulty]  = useState('medium');
  const [records,     setRecords]     = useState({ easy: 999, medium: 999, hard: 999 });

  const [elapsed,  setElapsed]  = useState(0);
  const timerRef   = useRef(null);
  const elapsedRef = useRef(0);
  const movesRef   = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('techMemoryRecords');
      if (saved) setRecords(JSON.parse(saved));
    } catch (_) {}
  }, []);

  const startTimer = () => {
    clearInterval(timerRef.current);
    elapsedRef.current = 0;
    setElapsed(0);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(e => e + 1);
    }, 1000);
  };
  const stopTimer = () => clearInterval(timerRef.current);
  useEffect(() => () => clearInterval(timerRef.current), []);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startGame = (diff) => {
    const { pairs } = DIFFICULTY_CONFIG[diff];
    const icons = [...allTechIcons].sort(() => Math.random() - 0.5).slice(0, pairs);
    const deck  = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map(c => ({ ...c, uid: Math.random() }));

    setCards(deck);
    setDifficulty(diff);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
    movesRef.current = 0;
    setWon(false);
    setIsNewRecord(false);
    setDisabled(false);
    setGameActive(true);
    startTimer();
  };

  const handleClick = useCallback((uid) => {
    if (disabled || flipped.includes(uid) || solved.includes(uid)) return;

    if (flipped.length === 0) { setFlipped([uid]); return; }

    if (flipped.length === 1) {
      setDisabled(true);
      const pair     = [flipped[0], uid];
      setFlipped(pair);
      const newMoves = movesRef.current + 1;
      movesRef.current = newMoves;
      setMoves(newMoves);

      setCards(prev => {
        const a = prev.find(c => c.uid === pair[0]);
        const b = prev.find(c => c.uid === uid);

        if (a?.id === b?.id) {
          setSolved(s => {
            const next = [...s, pair[0], uid];
            if (next.length === prev.length) setTimeout(() => handleWin(newMoves), 500);
            return next;
          });
          setFlipped([]);
          setDisabled(false);
        } else {
          setTimeout(() => { setFlipped([]); setDisabled(false); }, 950);
        }
        return prev;
      });
    }
  }, [disabled, flipped, solved]);

  const handleWin = (finalMoves) => {
    stopTimer();
    setWon(true);
    setRecords(prev => {
      if (finalMoves < prev[difficulty]) {
        const next = { ...prev, [difficulty]: finalMoves };
        localStorage.setItem('techMemoryRecords', JSON.stringify(next));
        setIsNewRecord(true);
        return next;
      }
      return prev;
    });
  };

  const handleBack = () => {
    if (gameActive) { stopTimer(); setGameActive(false); setWon(false); }
    else onBack?.();
  };

  const { cols, cardSize } = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="w-full max-w-4xl mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-4 sm:p-6 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center">

      {/* ── Back button ── */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={handleBack}
          className="text-white/50 hover:text-white flex items-center gap-1.5 text-sm font-bold transition-colors"
        >
          <Icon icon="solar:arrow-left-bold" />
          {gameActive ? (common?.quit ?? 'Main Menu') : (common?.back ?? 'Back')}
        </button>
      </div>

      {/* ── Title (always visible) ── */}
      <div className="text-center mb-4 relative z-10 mt-10 sm:mt-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center justify-center gap-2 sm:gap-3">
          <Icon icon="solar:sd-card-bold-duotone" className="text-primary animate-pulse text-2xl sm:text-3xl" />
          <span className="text-white">{txt?.title ?? 'Tech Memory'}</span>
        </h2>
        {!gameActive && (
          <p className="text-gray-400 text-sm mt-1">{txt?.subtitle ?? 'Test your memory across different levels.'}</p>
        )}
      </div>

      {/* ── Difficulty selector ── */}
      {!gameActive && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg z-10">
          {(['easy', 'medium', 'hard']).map((lvl) => (
            <button
              key={lvl}
              onClick={() => startGame(lvl)}
              className="group relative bg-surface/50 border border-white/10 hover:border-primary/50 p-5 rounded-2xl transition-all hover:-translate-y-1 active:scale-95"
            >
              <div className="absolute top-2 right-2 text-xs text-gray-500 font-mono flex gap-1">
                <span>{txt?.bestScore ?? 'Best'}:</span>
                <span className={records[lvl] === 999 ? 'text-gray-600' : 'text-primary'}>
                  {records[lvl] === 999 ? '–' : records[lvl]}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 capitalize group-hover:text-primary transition-colors">
                {txt?.modes?.[lvl] ?? lvl}
              </h3>
              <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                <div className={`h-full ${lvl === 'easy' ? 'bg-green-500 w-1/3' : lvl === 'medium' ? 'bg-yellow-500 w-2/3' : 'bg-red-500 w-full'}`} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Game area ── */}
      {gameActive && (
        <div className="w-full z-10 flex flex-col items-center">

          {/* ── Stats row – responsive, never wraps off screen ── */}
          <div className="w-full max-w-lg mb-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 bg-black/20 rounded-2xl border border-white/5">
              {/* Moves */}
              <span className="font-mono text-xs sm:text-sm text-white whitespace-nowrap">
                {txt?.moves ?? 'Moves'}: <span className="text-primary font-bold">{moves}</span>
              </span>

              {/* Timer */}
              <span className={`font-mono text-xs sm:text-sm whitespace-nowrap ${
                elapsed > 120 ? 'text-red-400' : elapsed > 60 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                ⏱ {formatTime(elapsed)}
              </span>

              {/* Record */}
              <span className="font-mono text-xs text-white/50 whitespace-nowrap">
                {txt?.bestScore ?? 'Best'}: {records[difficulty] === 999 ? '–' : records[difficulty]}
              </span>

              {/* Restart */}
              <button
                onPointerDown={() => startGame(difficulty)}
                className="text-primary hover:text-white transition-colors ml-auto"
                title={common?.restart ?? 'Restart'}
              >
                <Icon icon="solar:refresh-circle-bold" width={20} />
              </button>
            </div>
          </div>

          {/* ── Card grid ── */}
          <div className={`grid gap-2 sm:gap-3 max-w-2xl mx-auto ${cols}`}>
            {cards.map((card) => {
              const isFlipped = flipped.includes(card.uid) || solved.includes(card.uid);
              const isSolved  = solved.includes(card.uid);
              return (
                <div
                  key={card.uid}
                  className={`aspect-square cursor-pointer relative ${cardSize}`}
                  style={{ perspective: '800px' }}
                  onPointerDown={() => handleClick(card.uid)}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="w-full h-full relative"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Back face */}
                    <div
                      className="absolute inset-0 w-full h-full bg-surface border border-white/10 rounded-xl flex items-center justify-center hover:border-primary/40 transition-colors"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <Icon icon="solar:code-square-bold" className="text-gray-600 text-xl opacity-50" />
                    </div>
                    {/* Front face */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                        isSolved
                          ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(255,209,0,0.3)]'
                          : 'bg-[#1a1a1a] border-white/20'
                      }`}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <Icon icon={card.icon} className="text-2xl sm:text-3xl text-white drop-shadow-md" />
                      {difficulty !== 'hard' && (
                        <span className="text-[9px] text-white/40 mt-1 font-mono">{card.name}</span>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Win overlay ── */}
      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 rounded-3xl backdrop-blur-sm p-4"
          >
            <div className="bg-surface border border-primary/50 p-6 sm:p-8 rounded-2xl text-center shadow-2xl relative overflow-hidden max-w-xs w-full">
              {isNewRecord && (
                <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold py-1 animate-pulse">
                  {txt?.newRecord ?? '🏆 New Record!'}
                </div>
              )}
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 mt-4">{txt?.winTitle ?? 'Well Done!'}</h3>
              <p className="text-gray-300 mb-1 text-sm">
                {txt?.winSubtitle ?? 'Completed in'} <span className="text-primary font-bold">{moves}</span> {(txt?.moves ?? 'moves').toLowerCase()}.
              </p>
              <p className="text-gray-500 text-xs mb-5 font-mono">{common?.time ?? 'Time'}: {formatTime(elapsed)}</p>
              <div className="flex flex-col gap-2">
                <button
                  onPointerDown={() => startGame(difficulty)}
                  className="w-full bg-primary text-bg font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors"
                >
                  {txt?.playAgain ?? 'Play Again'}
                </button>
                <button
                  onPointerDown={() => { stopTimer(); setWon(false); setGameActive(false); }}
                  className="w-full bg-transparent border border-white/20 text-white font-bold px-6 py-2 rounded-xl hover:bg-white/10 text-sm transition-colors"
                >
                  {common?.quit ?? 'Main Menu'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}