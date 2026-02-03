import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ZipGame({ onBack }) {
  const { t } = useLanguage();
  
  // Acessa os níveis traduzidos
  const levels = t?.minigames?.zip?.levels || [];
  
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState('playing'); 
  const [feedback, setFeedback] = useState(null); 
  const [highScore, setHighScore] = useState(0);

  const inputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('zipHighScore');
    if (saved) setHighScore(parseInt(saved));
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const currentLevel = levels[currentLevelIndex];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status !== 'playing') return;

    const cleanInput = userInput.trim().toUpperCase();
    const cleanAnswer = currentLevel?.answer?.toUpperCase();

    if (cleanInput === cleanAnswer) {
      // ACERTOU
      setFeedback('correct');
      setScore(score + 100);
      
      const newScore = score + 100;
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('zipHighScore', newScore.toString());
      }

      setTimeout(() => {
        setFeedback(null);
        setUserInput('');
        
        if (currentLevelIndex + 1 < levels.length) {
          setCurrentLevelIndex(prev => prev + 1);
        } else {
          setStatus('won');
        }
      }, 1000);

    } else {
      // ERROU
      setFeedback('wrong');
      setLives(prev => prev - 1);
      
      if (lives - 1 <= 0) {
        setStatus('gameover');
      } else {
        setTimeout(() => {
            setFeedback(null);
            setUserInput('');
            inputRef.current.focus();
        }, 1000);
      }
    }
  };

  const restartGame = () => {
    setCurrentLevelIndex(0);
    setScore(0);
    setLives(3);
    setStatus('playing');
    setUserInput('');
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Helper de textos
  const txt = t?.minigames?.zip;
  const common = t?.minigames?.common;

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0d1117] rounded-3xl border border-gray-800 p-6 shadow-2xl font-mono relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none opacity-20 bg-[length:100%_2px,3px_100%]"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-white flex items-center gap-2 text-xs font-bold transition-colors">
          <Icon icon="solar:arrow-left-bold" /> {common?.exit}
        </button>
        
        <div className="flex flex-col items-end">
            <div className="text-xs text-gray-500">{common?.level} {currentLevelIndex + 1}/{levels.length}</div>
            <div className="flex gap-1 mt-1">
                {[...Array(3)].map((_, i) => (
                    <Icon key={i} icon="solar:heart-bold" className={i < lives ? "text-red-500" : "text-gray-800"} />
                ))}
            </div>
        </div>
      </div>

      {/* Área do Jogo */}
      <div className="relative z-10 text-center py-4">
        
        {status === 'playing' && currentLevel && (
            <>
                <motion.div 
                    key={currentLevel.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-8"
                >
                    <div className="text-green-500 text-xs mb-2 tracking-widest opacity-70">/// {txt?.title} ///</div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{currentLevel.question}</h2>
                    {lives < 3 && <p className="text-xs text-yellow-500 animate-pulse">{txt?.hint} {currentLevel.hint}</p>}
                </motion.div>

                <form onSubmit={handleSubmit} className="relative max-w-xs mx-auto">
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className={`w-full bg-black/50 border-2 rounded-lg px-4 py-3 text-center text-xl text-white outline-none focus:border-green-500 transition-all ${feedback === 'wrong' ? 'border-red-500 shake' : 'border-gray-700'}`}
                        placeholder={txt?.placeholder}
                        autoFocus
                    />
                    <button 
                        type="submit"
                        className="absolute right-2 top-2 bottom-2 bg-green-600 hover:bg-green-500 text-black px-4 rounded font-bold transition-colors"
                    >
                        <Icon icon="solar:arrow-right-bold" />
                    </button>
                </form>
                
                <AnimatePresence>
                    {feedback === 'correct' && (
                        <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="absolute -bottom-12 left-0 right-0 text-green-400 font-bold flex justify-center items-center gap-2"
                        >
                            <Icon icon="solar:verified-check-bold" /> {txt?.correct}
                        </motion.div>
                    )}
                    {feedback === 'wrong' && (
                        <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="absolute -bottom-12 left-0 right-0 text-red-400 font-bold flex justify-center items-center gap-2"
                        >
                            <Icon icon="solar:close-circle-bold" /> {txt?.wrong}
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )}

        {status === 'gameover' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
                <Icon icon="solar:bomb-emoji-bold" className="text-red-500 text-6xl mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">{common?.gameOver}</h3>
                <div className="text-xl font-mono text-green-400 mb-8">{common?.score}: {score}</div>
                
                <button onClick={restartGame} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                    {common?.restart}
                </button>
            </motion.div>
        )}

        {status === 'won' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
                <Icon icon="solar:cup-star-bold" className="text-yellow-400 text-6xl mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h3 className="text-2xl font-bold text-white mb-2">{txt?.hackComplete}</h3>
                <div className="text-xl font-mono text-green-400 mb-8">{common?.score}: {score}</div>
                
                <button onClick={restartGame} className="bg-green-500 text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                    {common?.playAgain}
                </button>
            </motion.div>
        )}

      </div>
      
      <div className="mt-8 border-t border-gray-800 pt-4 flex justify-between text-xs text-gray-600 font-mono">
        <span>ZIP_PROTOCOL_V1.0</span>
        <span>{common?.record?.toUpperCase()}: {highScore}</span>
      </div>

    </div>
  );
}