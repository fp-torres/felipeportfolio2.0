import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const allTechIcons = [
  { id: 1,  icon: 'devicon:react',       name: 'React'      },
  { id: 2,  icon: 'devicon:python',      name: 'Python'     },
  { id: 3,  icon: 'devicon:javascript',  name: 'JS'         },
  { id: 4,  icon: 'devicon:typescript',  name: 'TS'         },
  { id: 5,  icon: 'devicon:linux',       name: 'Linux'      },
  { id: 6,  icon: 'devicon:docker',      name: 'Docker'     },
  { id: 7,  icon: 'devicon:mysql',       name: 'MySQL'      },
  { id: 8,  icon: 'devicon:git',         name: 'Git'        },
  { id: 9,  icon: 'devicon:nodejs',      name: 'Node'       },
  { id: 10, icon: 'devicon:php',         name: 'PHP'        },
  { id: 11, icon: 'devicon:java',        name: 'Java'       },
  { id: 12, icon: 'devicon:html5',       name: 'HTML'       },
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

  const [cards,      setCards]      = useState([]);
  const [flipped,    setFlipped]    = useState([]);
  const [solved,     setSolved]     = useState([]);
  const [disabled,   setDisabled]   = useState(false);
  const [moves,      setMoves]      = useState(0);
  const [won,        setWon]        = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [isNewRecord,setIsNewRecord]= useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [records,    setRecords]    = useState({ easy: 999, medium: 999, hard: 999 });

  // ── timer ──────────────────────────────────────────────────────────────────
  const [elapsed,   setElapsed]    = useState(0);   // segundos
  const timerRef    = useRef(null);
  const elapsedRef  = useRef(0);

  // ── ref para moves (evita closure stale no handleWin) ──────────────────────
  const movesRef    = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('techMemoryRecords');
      if (saved) setRecords(JSON.parse(saved));
    } catch (_) {}
  }, []);

  // ── Timer: inicia/para junto com o jogo ────────────────────────────────────
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

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  // ── Inicia jogo ─────────────────────────────────────────────────────────────
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

  // ── Clique em carta ─────────────────────────────────────────────────────────
  const handleClick = useCallback((uid) => {
    if (disabled || flipped.includes(uid) || solved.includes(uid)) return;

    if (flipped.length === 0) {
      setFlipped([uid]);
      return;
    }

    if (flipped.length === 1) {
      setDisabled(true);
      const pair = [flipped[0], uid];
      setFlipped(pair);

      const newMoves = movesRef.current + 1;
      movesRef.current = newMoves;
      setMoves(newMoves);

      // Verifica match
      setCards(prev => {
        const a = prev.find(c => c.uid === pair[0]);
        const b = prev.find(c => c.uid === uid);

        if (a?.id === b?.id) {
          setSolved(s => {
            const next = [...s, pair[0], uid];
            // Verifica vitória com valor atualizado
            if (next.length === prev.length) {
              setTimeout(() => handleWin(newMoves), 500);
            }
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

  // ── Vitória – usa newMoves passado diretamente (sem closure) ───────────────
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
    <div className="w-full max-w-4xl mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center">

      {/* Voltar */}
      <div className="absolute top-6 left-6 z-20">
        <button onClick={handleBack} className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">
          <Icon icon="solar:arrow-left-bold" /> {gameActive ? common?.quit : common?.back}
        </button>
      </div>

      {/* Título */}
      <div className="text-center mb-6 relative z-10 mt-8">
        <h2 className="text-3xl font-bold mb-1 flex items-center justify-center gap-3">
          <Icon icon="solar:sd-card-bold-duotone" className="text-primary animate-pulse" />
          <span className="text-white">{txt?.title}</span>
        </h2>
        {!gameActive && <p className="text-gray-400 text-sm">{txt?.subtitle}</p>}
      </div>

      {/* ── Menu de dificuldade ── */}
      {!gameActive && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg z-10">
          {(['easy', 'medium', 'hard'] ).map((lvl) => (
            <button
              key={lvl}
              onClick={() => startGame(lvl)}
              className="group relative bg-surface/50 border border-white/10 hover:border-primary/50 p-6 rounded-2xl transition-all hover:-translate-y-1"
            >
              <div className="absolute top-2 right-2 text-xs text-gray-500 font-mono flex gap-1">
                <span>{txt?.bestScore}:</span>
                <span className={records[lvl] === 999 ? 'text-gray-600' : 'text-primary'}>
                  {records[lvl] === 999 ? '–' : records[lvl]}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1 capitalize group-hover:text-primary transition-colors">
                {txt?.modes?.[lvl] ?? lvl}
              </h3>
              <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                <div className={`h-full ${lvl === 'easy' ? 'bg-green-500 w-1/3' : lvl === 'medium' ? 'bg-yellow-500 w-2/3' : 'bg-red-500 w-full'}`} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Área do jogo ── */}
      {gameActive && (
        <div className="w-full z-10 flex flex-col items-center">
          {/* Placar + timer */}
          <div className="flex items-center w-full max-w-lg mb-5 px-4 py-2 bg-black/20 rounded-full border border-white/5 gap-2">
            <div className="flex items-center gap-3 flex-1 text-sm font-mono">
              <span className="text-white">
                {txt?.moves}: <span className="text-primary font-bold">{moves}</span>
              </span>
              <span className="text-white/30">|</span>
              {/* Timer */}
              <span className={`font-mono text-sm ${elapsed > 120 ? 'text-red-400' : elapsed > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                ⏱ {formatTime(elapsed)}
              </span>
              <span className="text-white/30">|</span>
              <span className="text-white/50 text-xs">
                {txt?.bestScore}: {records[difficulty] === 999 ? '–' : records[difficulty]}
              </span>
            </div>
            <button
              onPointerDown={() => startGame(difficulty)}
              className="text-primary hover:text-white transition-colors"
              title={common?.restart}
            >
              <Icon icon="solar:refresh-circle-bold" width={22} />
            </button>
          </div>

          {/* Grid de cartas */}
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
                    {/* Verso (frente oculta) */}
                    <div
                      className="absolute inset-0 w-full h-full bg-surface border border-white/10 rounded-xl flex items-center justify-center hover:border-primary/40 transition-colors"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <Icon icon="solar:code-square-bold" className="text-gray-600 text-xl opacity-50" />
                    </div>
                    {/* Frente (ícone) */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                        isSolved
                          ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(255,209,0,0.3)]'
                          : 'bg-[#1a1a1a] border-white/20'
                      }`}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <Icon icon={card.icon} className="text-2xl sm:text-3xl text-white drop-shadow-md" />
                      {/* Nome apenas em cartas maiores */}
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

      {/* ── Overlay vitória ── */}
      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 rounded-3xl backdrop-blur-sm"
          >
            <div className="bg-surface border border-primary/50 p-8 rounded-2xl text-center shadow-2xl relative overflow-hidden max-w-xs w-full mx-4">
              {isNewRecord && (
                <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold py-1 animate-pulse">
                  {txt?.newRecord ?? '🏆 Novo Recorde!'}
                </div>
              )}
              <h3 className="text-2xl font-bold text-white mb-1 mt-4">{txt?.winTitle}</h3>
              <p className="text-gray-300 mb-1 text-sm">
                {txt?.winSubtitle} <span className="text-primary font-bold">{moves}</span> {txt?.moves?.toLowerCase()}.
              </p>
              <p className="text-gray-500 text-xs mb-6 font-mono">Tempo: {formatTime(elapsed)}</p>
              <div className="flex flex-col gap-2">
                <button
                  onPointerDown={() => startGame(difficulty)}
                  className="w-full bg-primary text-bg font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors"
                >
                  {txt?.playAgain}
                </button>
                <button
                  onPointerDown={() => { stopTimer(); setWon(false); setGameActive(false); }}
                  className="w-full bg-transparent border border-white/20 text-white font-bold px-6 py-2 rounded-xl hover:bg-white/10 text-sm transition-colors"
                >
                  {common?.quit}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}