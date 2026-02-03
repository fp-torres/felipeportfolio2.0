import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const SYMBOLS = [
  { id: 'A', icon: 'solar:code-circle-bold', color: 'text-green-400' },
  { id: 'B', icon: 'solar:shield-warning-bold', color: 'text-red-400' },
  { id: 'C', icon: 'solar:cpu-bolt-bold', color: 'text-blue-400' },
  { id: 'D', icon: 'solar:wi-fi-router-bold', color: 'text-yellow-400' },
  { id: 'E', icon: 'solar:database-bold', color: 'text-purple-400' },
  { id: 'F', icon: 'solar:lock-password-bold', color: 'text-orange-400' },
];

export default function Decryptor({ onBack }) {
  const { t } = useLanguage();
  
  const getLevelConfig = (level) => {
    if (level === 1) return { slots: 3, options: 4, tries: 8 }; 
    if (level === 2) return { slots: 4, options: 5, tries: 10 }; 
    if (level >= 3) return { slots: 5, options: 6, tries: 12 }; 
    return { slots: 4, options: 5, tries: 10 };
  };

  const [level, setLevel] = useState(1);
  const [secretCode, setSecretCode] = useState([]);
  const [guesses, setGuesses] = useState([]); 
  const [currentGuess, setCurrentGuess] = useState([]); 
  const [gameStatus, setGameStatus] = useState('playing'); 
  const [highScore, setHighScore] = useState(1);

  const listRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('decryptorRecord');
    if (saved) setHighScore(parseInt(saved));
    startLevel(1);
  }, []);

  useEffect(() => {
    if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [guesses]);

  const startLevel = (lvl) => {
    const config = getLevelConfig(lvl);
    const newCode = [];
    for (let i = 0; i < config.slots; i++) {
        const randomIndex = Math.floor(Math.random() * config.options);
        newCode.push(SYMBOLS[randomIndex]);
    }
    setSecretCode(newCode);
    setGuesses([]);
    setCurrentGuess([]);
    setGameStatus('playing');
    setLevel(lvl);
  };

  const handleSelectSymbol = (symbol) => {
    if (gameStatus !== 'playing') return;
    const config = getLevelConfig(level);
    if (currentGuess.length < config.slots) {
        setCurrentGuess([...currentGuess, symbol]);
    }
  };

  const handleBackspace = () => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (gameStatus !== 'playing') return;
    const config = getLevelConfig(level);
    if (currentGuess.length !== config.slots) return;

    let exactMatches = 0;
    let partialMatches = 0;
    const tempSecret = [...secretCode];
    const tempGuess = [...currentGuess];

    for (let i = 0; i < config.slots; i++) {
        if (tempGuess[i].id === tempSecret[i].id) {
            exactMatches++;
            tempSecret[i] = null; 
            tempGuess[i] = 'MATCHED';
        }
    }

    for (let i = 0; i < config.slots; i++) {
        if (tempGuess[i] === 'MATCHED') continue;
        const foundIndex = tempSecret.findIndex(s => s && s.id === tempGuess[i].id);
        if (foundIndex !== -1) {
            partialMatches++;
            tempSecret[foundIndex] = null; 
        }
    }

    const newHistory = [...guesses, { guess: currentGuess, exact: exactMatches, partial: partialMatches }];
    setGuesses(newHistory);
    setCurrentGuess([]);

    if (exactMatches === config.slots) {
        setGameStatus('won');
        if (level >= highScore) {
            setHighScore(level + 1);
            localStorage.setItem('decryptorRecord', (level + 1).toString());
        }
    } else if (newHistory.length >= config.tries) {
        setGameStatus('lost');
    }
  };

  const nextLevel = () => startLevel(level + 1);
  const retryLevel = () => startLevel(level);

  const config = getLevelConfig(level);
  const currentOptions = SYMBOLS.slice(0, config.options);
  
  // Helpers de texto
  const common = t?.minigames?.common;
  const txt = t?.minigames?.decryptor;

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0F172A] rounded-3xl border border-white/10 p-6 shadow-2xl relative flex flex-col h-[600px]">
      
      <div className="flex justify-between items-center mb-4 shrink-0">
        <button onClick={onBack} className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold">
          <Icon icon="solar:arrow-left-bold" /> {common?.exit}
        </button>
        <div className="flex gap-3">
             <div className="text-white font-mono text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/30">
                {common?.level} {level}
            </div>
            <div className="text-gray-400 font-mono text-xs bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                {common?.max}: {highScore}
            </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
        {guesses.map((turn, idx) => (
            <div key={idx} className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5">
                <div className="flex gap-2">
                    {turn.guess.map((s, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Icon icon={s.icon} className={s.color} />
                        </div>
                    ))}
                </div>
                <div className="flex gap-1">
                    {[...Array(turn.exact)].map((_, i) => <div key={`e-${i}`} className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>)}
                    {[...Array(turn.partial)].map((_, i) => <div key={`p-${i}`} className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]"></div>)}
                    {[...Array(config.slots - turn.exact - turn.partial)].map((_, i) => <div key={`w-${i}`} className="w-3 h-3 rounded-full bg-gray-700"></div>)}
                </div>
            </div>
        ))}

        {gameStatus === 'playing' && (
            <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-primary/30 animate-pulse">
                <div className="flex gap-2">
                    {[...Array(config.slots)].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/10">
                            {currentGuess[i] ? (
                                <Icon icon={currentGuess[i].icon} className={currentGuess[i].color} />
                            ) : (
                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="text-xs text-gray-400 font-mono">
                    {guesses.length + 1}/{config.tries}
                </div>
            </div>
        )}
      </div>

      <AnimatePresence>
        {gameStatus !== 'playing' && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-6 top-1/3 bg-[#1e293b] border border-white/20 p-6 rounded-2xl shadow-2xl text-center z-20"
            >
                {gameStatus === 'won' ? (
                    <>
                        <Icon icon="solar:lock-unlocked-bold" className="text-green-400 text-5xl mx-auto mb-2" />
                        <h3 className="text-2xl font-bold text-white mb-2">{txt?.accessGranted}</h3>
                        <p className="text-gray-400 text-sm mb-4">{txt?.cracked}</p>
                        <button onClick={nextLevel} className="w-full bg-green-500 text-black font-bold py-3 rounded-xl hover:bg-green-400 transition-colors">
                            {common?.nextLevel}
                        </button>
                    </>
                ) : (
                    <>
                        <Icon icon="solar:shield-warning-bold" className="text-red-500 text-5xl mx-auto mb-2" />
                        <h3 className="text-2xl font-bold text-white mb-2">{txt?.accessDenied}</h3>
                        <div className="flex justify-center gap-2 mb-4 bg-black/30 p-2 rounded-lg">
                            {secretCode.map((s, i) => (
                                <Icon key={i} icon={s.icon} className={s.color} />
                            ))}
                        </div>
                        <button onClick={retryLevel} className="w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors">
                            {common?.tryAgain}
                        </button>
                    </>
                )}
            </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-4 gap-2 mt-auto pt-4 border-t border-white/5">
        {currentOptions.map((symbol) => (
            <button
                key={symbol.id}
                onClick={() => handleSelectSymbol(symbol)}
                disabled={gameStatus !== 'playing'}
                className="bg-black/30 hover:bg-white/10 p-3 rounded-xl flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50"
            >
                <Icon icon={symbol.icon} className={`${symbol.color} text-2xl`} />
            </button>
        ))}
        
        <button 
            onClick={handleBackspace} 
            disabled={gameStatus !== 'playing'}
            className="col-span-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl flex items-center justify-center active:scale-95"
        >
            <Icon icon="solar:backspace-bold" className="text-xl" />
        </button>
        
        <button 
            onClick={handleSubmit} 
            disabled={gameStatus !== 'playing' || currentGuess.length !== config.slots}
            className={`col-span-2 rounded-xl flex items-center justify-center active:scale-95 font-bold transition-all ${
                currentGuess.length === config.slots 
                ? 'bg-primary text-bg hover:bg-yellow-400' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
        >
            {txt?.enter}
        </button>
      </div>

    </div>
  );
}