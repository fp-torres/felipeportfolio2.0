import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MatrixRecall({ onBack }) {
  const { t } = useLanguage();
  
  const LEVELS = [
    { id: 1, size: 3, tiles: 3 }, 
    { id: 2, size: 3, tiles: 4 },
    { id: 3, size: 4, tiles: 5 }, 
    { id: 4, size: 4, tiles: 6 },
    { id: 5, size: 5, tiles: 7 }, 
    { id: 6, size: 5, tiles: 8 },
    { id: 7, size: 6, tiles: 9 }, 
  ];

  const [levelIndex, setLevelIndex] = useState(0);
  const [pattern, setPattern] = useState([]); 
  const [selected, setSelected] = useState([]); 
  const [status, setStatus] = useState('preview'); 
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem('matrixRecallRecord');
    if (saved) setHighScore(parseInt(saved));
    startLevel(0);
  }, []);

  const currentLevel = LEVELS[levelIndex];

  const startLevel = (idx) => {
    const lvl = LEVELS[idx];
    const totalCells = lvl.size * lvl.size;
    
    const newPattern = new Set();
    while (newPattern.size < lvl.tiles) {
        newPattern.add(Math.floor(Math.random() * totalCells));
    }

    setPattern([...newPattern]);
    setSelected([]);
    setStatus('preview');
    setLevelIndex(idx);

    setTimeout(() => {
        setStatus('playing');
    }, 1500); 
  };

  const handleTileClick = (index) => {
    if (status !== 'playing') return;
    if (selected.includes(index)) return; 

    const newSelected = [...selected, index];
    setSelected(newSelected);

    if (pattern.includes(index)) {
        if (newSelected.filter(i => pattern.includes(i)).length === pattern.length) {
            setStatus('won');
            if (levelIndex + 1 >= highScore) {
                setHighScore(levelIndex + 1);
                localStorage.setItem('matrixRecallRecord', (levelIndex + 1).toString());
            }
            setTimeout(() => {
                if (levelIndex < LEVELS.length - 1) {
                    startLevel(levelIndex + 1);
                } else {
                    startLevel(0); 
                }
            }, 1000);
        }
    } else {
        setStatus('error'); 
        setLives(prev => prev - 1);
        
        setTimeout(() => {
            if (lives - 1 <= 0) {
                setStatus('lost');
            } else {
                startLevel(levelIndex);
            }
        }, 1000);
    }
  };

  const restartGame = () => {
    setLives(3);
    startLevel(0);
  };

  const renderTile = (index) => {
    let bgClass = "bg-white/5 hover:bg-white/10"; 
    let icon = null;

    if (status === 'preview') {
        if (pattern.includes(index)) {
            bgClass = "bg-white text-bg shadow-[0_0_15px_white]"; 
        }
    } else if (status === 'playing' || status === 'won' || status === 'error') {
        if (selected.includes(index)) {
            if (pattern.includes(index)) {
                bgClass = "bg-green-500 shadow-[0_0_15px_#22c55e]"; 
                icon = <Icon icon="solar:check-circle-bold" className="text-white text-xl" />;
            } else {
                bgClass = "bg-red-500 shadow-[0_0_15px_#ef4444]"; 
                icon = <Icon icon="solar:close-circle-bold" className="text-white text-xl" />;
            }
        }
    } else if (status === 'lost') {
        if (pattern.includes(index)) bgClass = "bg-white/20";
        if (selected.includes(index) && !pattern.includes(index)) bgClass = "bg-red-500/50";
    }

    return (
        <motion.button
            key={index}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleTileClick(index)}
            className={`
                aspect-square rounded-xl flex items-center justify-center transition-all duration-200 border border-white/5
                ${bgClass}
            `}
            disabled={status !== 'playing'}
        >
            {icon}
        </motion.button>
    );
  };

  // Helpers
  const common = t?.minigames?.common;
  const txt = t?.minigames?.matrix;

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0F172A] rounded-3xl border border-white/10 p-6 shadow-2xl relative min-h-[500px] flex flex-col">
      
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold">
          <Icon icon="solar:arrow-left-bold" /> {common?.exit}
        </button>
        
        <div className="flex flex-col items-end">
            <div className="flex gap-1 mb-1">
                {[...Array(3)].map((_, i) => (
                    <Icon key={i} icon="solar:heart-bold" className={i < lives ? "text-red-500" : "text-gray-800"} />
                ))}
            </div>
            <div className="text-xs text-gray-500">{common?.level} {levelIndex + 1} • {common?.max} {highScore}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        
        {status === 'lost' ? (
            <div className="text-center animate-in zoom-in duration-300">
                <Icon icon="solar:sad-face-bold" className="text-red-500 text-6xl mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">{txt?.fail}</h3>
                <p className="text-gray-400 mb-6">{common?.gameOver}</p>
                <button onClick={restartGame} className="bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                    <Icon icon="solar:restart-bold" /> {common?.tryAgain}
                </button>
            </div>
        ) : (
            <div 
                className="grid gap-2 w-full max-w-[300px]"
                style={{ 
                    gridTemplateColumns: `repeat(${currentLevel.size}, 1fr)` 
                }}
            >
                {Array.from({ length: currentLevel.size * currentLevel.size }).map((_, i) => renderTile(i))}
            </div>
        )}

      </div>

      <div className="text-center h-12 flex items-center justify-center mt-4">
        {status === 'preview' && <p className="text-primary font-bold animate-pulse text-lg">{txt?.memorize}</p>}
        {status === 'playing' && <p className="text-gray-400">{txt?.repeat}</p>}
        {status === 'won' && <p className="text-green-400 font-bold flex items-center gap-2"><Icon icon="solar:verified-check-bold" /> {txt?.success}</p>}
        {status === 'error' && <p className="text-red-400 font-bold">X</p>}
      </div>

    </div>
  );
}