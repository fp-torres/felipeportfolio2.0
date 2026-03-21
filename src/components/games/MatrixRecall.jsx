import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_LEVELS = [
  { id: 1, size: 3, tiles: 3 },
  { id: 2, size: 3, tiles: 4 },
  { id: 3, size: 4, tiles: 5 },
  { id: 4, size: 4, tiles: 6 },
  { id: 5, size: 5, tiles: 7 },
  { id: 6, size: 5, tiles: 8 },
  { id: 7, size: 6, tiles: 9 },
];

const getLevel = (idx) => {
  if (idx < BASE_LEVELS.length) return BASE_LEVELS[idx];
  const extra = idx - BASE_LEVELS.length + 1;
  const size  = Math.min(7 + Math.floor(extra / 2), 10);
  const tiles = 9 + extra;
  return { id: idx + 1, size, tiles };
};

export default function MatrixRecall({ onBack }) {
  const { t } = useLanguage();
  const common = t?.minigames?.common;
  const txt    = t?.minigames?.matrix;

  const [levelIndex,  setLevelIndex]  = useState(0);
  const [pattern,     setPattern]     = useState([]);
  const [goldenTile,  setGoldenTile]  = useState(null);
  const [goldenUsed,  setGoldenUsed]  = useState(false);
  const [selected,    setSelected]    = useState([]);
  const [status,      setStatus]      = useState('idle'); // idle | preview | countdown | playing | won | error | lost
  const [countdown,   setCountdown]   = useState(3);
  const [lives,       setLives]       = useState(3);
  const [highScore,   setHighScore]   = useState(1);

  const currentLevel = getLevel(levelIndex);
  const isInfinite   = levelIndex >= BASE_LEVELS.length;

  useEffect(() => {
    const saved = localStorage.getItem('matrixRecallRecord');
    if (saved) setHighScore(parseInt(saved));
    // Do NOT auto-start — wait for the player to press Start
  }, []);

  useEffect(() => {
    if (status !== 'countdown') return;
    if (countdown <= 0) { setStatus('playing'); return; }
    const id = setTimeout(() => setCountdown(c => c - 1), 700);
    return () => clearTimeout(id);
  }, [status, countdown]);

  const startLevel = (idx) => {
    const lvl   = getLevel(idx);
    const total = lvl.size * lvl.size;

    const patSet = new Set();
    while (patSet.size < lvl.tiles) patSet.add(Math.floor(Math.random() * total));
    const patArr = [...patSet];

    const nonPat = [];
    for (let i = 0; i < total; i++) { if (!patSet.has(i)) nonPat.push(i); }
    const golden = nonPat.length > 0
      ? nonPat[Math.floor(Math.random() * nonPat.length)]
      : null;

    setPattern(patArr);
    setGoldenTile(golden);
    setGoldenUsed(false);
    setSelected([]);
    setLevelIndex(idx);

    const previewMs = 1000 + lvl.tiles * 200;
    setStatus('preview');
    setTimeout(() => {
      setStatus('countdown');
      setCountdown(3);
    }, previewMs);
  };

  const handleTileClick = (index) => {
    if (status !== 'playing') return;
    if (selected.includes(index)) return;

    const newSelected = [...selected, index];
    setSelected(newSelected);

    if (index === goldenTile && !goldenUsed) {
      setGoldenUsed(true);
      setLives(prev => Math.min(prev + 1, 3));
      return;
    }

    if (pattern.includes(index)) {
      const correctCount = newSelected.filter(i => pattern.includes(i)).length;
      if (correctCount === pattern.length) {
        setStatus('won');
        const newRecord = levelIndex + 1;
        if (newRecord >= highScore) {
          setHighScore(newRecord);
          localStorage.setItem('matrixRecallRecord', newRecord.toString());
        }
        setTimeout(() => startLevel(levelIndex + 1), 950);
      }
    } else {
      setStatus('error');
      const newLives = lives - 1;
      setLives(newLives);
      setTimeout(() => {
        if (newLives <= 0) setStatus('lost');
        else startLevel(levelIndex);
      }, 950);
    }
  };

  const restartGame = () => { setLives(3); startLevel(0); };
  const beginGame   = () => { setLives(3); startLevel(0); };

  const renderTile = (index) => {
    const isPattern  = pattern.includes(index);
    const isSelected = selected.includes(index);
    const isGolden   = index === goldenTile && !goldenUsed;
    const wasGolden  = index === goldenTile && goldenUsed && isSelected;

    let bg   = 'bg-white/5 hover:bg-white/10';
    let icon = null;
    let anim = {};

    if (status === 'preview') {
      if (isPattern) {
        bg = 'bg-white text-bg shadow-[0_0_15px_white] scale-105';
      } else if (isGolden) {
        bg   = 'bg-yellow-400 shadow-[0_0_15px_#facc15] scale-105';
        icon = <Icon icon="solar:star-bold" className="text-black text-xs" />;
      }
    } else if (status === 'countdown') {
      bg = 'bg-white/5';
    } else if (status === 'playing' || status === 'won' || status === 'error') {
      if (isSelected) {
        if (wasGolden) {
          bg   = 'bg-yellow-400 shadow-[0_0_15px_#facc15]';
          icon = <Icon icon="solar:star-bold" className="text-black text-sm" />;
          anim = { scale: [1, 1.2, 1] };
        } else if (isPattern) {
          bg   = 'bg-green-500 shadow-[0_0_15px_#22c55e]';
          anim = { scale: [1, 1.15, 1] };
          if (currentLevel.size < 6) {
            icon = <Icon icon="solar:check-circle-bold" className="text-white text-lg" />;
          }
        } else {
          bg   = 'bg-red-500 shadow-[0_0_15px_#ef4444]';
          icon = <Icon icon="solar:close-circle-bold" className="text-white text-lg" />;
        }
      } else if (isGolden) {
        bg   = 'bg-yellow-400/25 border border-yellow-400/50 animate-pulse';
        icon = <Icon icon="solar:star-bold" className="text-yellow-300 text-xs" />;
      }
    } else if (status === 'lost') {
      if (isPattern)              bg = 'bg-white/20 animate-pulse';
      if (isSelected && !isPattern) bg = 'bg-red-500/50';
    }

    return (
      <motion.button
        key={index}
        animate={anim}
        transition={{ duration: 0.22 }}
        className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-100 border border-white/5 ${bg}`}
        onPointerDown={() => handleTileClick(index)}
        disabled={status !== 'playing'}
      >
        {icon}
      </motion.button>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0F172A] rounded-3xl border border-white/10 p-4 sm:p-6 shadow-2xl relative min-h-[500px] flex flex-col">

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white flex items-center gap-1.5 text-sm font-bold transition-colors"
        >
          <Icon icon="solar:arrow-left-bold" /> {common?.exit ?? 'Exit'}
        </button>

        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={i === lives - 1 && lives > 0 ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon
                  icon="solar:heart-bold"
                  className={`transition-colors duration-300 ${i < lives ? 'text-red-500' : 'text-gray-800'}`}
                />
              </motion.div>
            ))}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
            {common?.level ?? 'Level'} {levelIndex + 1}
            {isInfinite && <span className="text-orange-400 font-bold">∞</span>}
            {' · '}
            <span className="text-gray-600">
              {common?.max ?? 'Max'} {highScore}
            </span>
          </div>
        </div>
      </div>

      {/* ── Title Banner ── */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
          <Icon icon="solar:widget-5-bold" className="text-primary text-sm" />
          <span className="text-sm font-bold text-white tracking-wider">{txt?.title ?? 'Matrix Recall'}</span>
        </div>
      </div>

      {/* ── Game area ── */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {status === 'idle' ? (
          <div className="text-center animate-in fade-in zoom-in duration-300 flex flex-col items-center gap-4 px-4">
            <Icon icon="solar:widget-5-bold" className="text-primary text-6xl" />
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{txt?.title ?? 'Matrix Recall'}</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                {txt?.description ?? 'Memorize the highlighted tiles, then repeat the pattern from memory.'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 font-mono bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <span className="flex items-center gap-1">
                <Icon icon="solar:heart-bold" className="text-red-500" /> 3 {common?.lives ?? 'lives'}
              </span>
              <span className="text-gray-700">·</span>
              <span className="flex items-center gap-1">
                <Icon icon="solar:star-bold" className="text-yellow-400" /> {txt?.goldenHint ?? '+1 life bonus available'}
              </span>
            </div>
            <button
              onPointerDown={beginGame}
              className="bg-primary text-bg px-10 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg mt-1"
            >
              <Icon icon="solar:play-bold" /> {common?.start ?? txt?.start ?? 'Start'}
            </button>
            {highScore > 1 && (
              <p className="text-gray-600 text-xs font-mono">
                {common?.record ?? 'Record'}: {common?.level ?? 'Level'} {highScore}
              </p>
            )}
          </div>
        ) : status === 'lost' ? (
          <div className="text-center animate-in zoom-in duration-300">
            <Icon icon="solar:sad-face-bold" className="text-red-500 text-6xl mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">{txt?.fail ?? 'SYSTEM FAILURE'}</h3>
            <p className="text-gray-400 mb-6">{common?.gameOver ?? 'Game Over'}</p>
            <button
              onClick={restartGame}
              className="bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
            >
              <Icon icon="solar:restart-bold" /> {common?.tryAgain ?? 'Try Again'}
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-[min(90vw,400px)]">

            {/* Countdown overlay */}
            <AnimatePresence mode="wait">
              {status === 'countdown' && countdown > 0 && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 2.2, opacity: 0 }}
                  animate={{ scale: 1,   opacity: 1 }}
                  exit={{   scale: 0.4,  opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 rounded-xl backdrop-blur-sm"
                >
                  <span className="text-8xl font-black text-primary drop-shadow-[0_0_30px_rgba(250,204,21,0.7)]">
                    {countdown}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid */}
            <div
              className="grid gap-2 sm:gap-3 w-full"
              style={{ gridTemplateColumns: `repeat(${currentLevel.size}, 1fr)` }}
            >
              {Array.from({ length: currentLevel.size * currentLevel.size }).map((_, i) =>
                renderTile(i)
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Status footer ── */}
      <div className="text-center min-h-[48px] flex items-center justify-center mt-4 gap-2 flex-wrap">
        {status === 'preview' && (
          <p className="text-primary font-bold animate-pulse text-xl tracking-widest">
            {txt?.memorize ?? 'MEMORIZE!'}
          </p>
        )}

        {status === 'countdown' && (
          <p className="text-gray-500 text-sm">...</p>
        )}

        {status === 'playing' && (
          <p className="text-gray-400 text-sm animate-in fade-in flex items-center gap-2 flex-wrap justify-center">
            {txt?.repeat ?? 'Repeat the pattern.'}
            {goldenTile !== null && !goldenUsed && (
              <span className="text-yellow-400 text-xs flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                <Icon icon="solar:star-bold" /> {txt?.goldenHint ?? '+1 life available'}
              </span>
            )}
            {goldenUsed && (
              <span className="text-green-400 text-xs flex items-center gap-1">
                <Icon icon="solar:heart-bold" /> {txt?.goldenUsed ?? '+1 life!'}
              </span>
            )}
          </p>
        )}

        {status === 'won' && (
          <p className="text-green-400 font-bold flex items-center gap-2">
            <Icon icon="solar:verified-check-bold" /> {txt?.success ?? 'SUCCESS!'}
          </p>
        )}

        {status === 'error' && (
          <p className="text-red-400 font-bold animate-pulse">✗</p>
        )}
      </div>
    </div>
  );
}