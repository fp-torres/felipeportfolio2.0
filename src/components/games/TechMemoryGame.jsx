import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const allTechIcons = [
  { id: 1, icon: "devicon:react", name: "React" },
  { id: 2, icon: "devicon:python", name: "Python" },
  { id: 3, icon: "devicon:javascript", name: "JS" },
  { id: 4, icon: "devicon:typescript", name: "TS" },
  { id: 5, icon: "devicon:linux", name: "Linux" },
  { id: 6, icon: "devicon:docker", name: "Docker" },
  { id: 7, icon: "devicon:mysql", name: "MySQL" },
  { id: 8, icon: "devicon:git", name: "Git" },
  { id: 9, icon: "devicon:nodejs", name: "Node" },
  { id: 10, icon: "devicon:php", name: "PHP" },
  { id: 11, icon: "devicon:java", name: "Java" },
  { id: 12, icon: "devicon:html5", name: "HTML" },
];

export default function TechMemoryGame({ onBack }) {
  const { t } = useLanguage();
  
  // Acessa os textos específicos do jogo e os comuns
  const txt = t?.minigames?.memory;
  const common = t?.minigames?.common;

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  
  const [difficulty, setDifficulty] = useState('medium'); 
  const [records, setRecords] = useState({ easy: 999, medium: 999, hard: 999 });

  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem('techMemoryRecords');
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }
    } catch (e) {
      console.error("Erro ao carregar recordes", e);
    }
  }, []);

  const startGame = (selectedDifficulty) => {
    let numPairs;
    switch (selectedDifficulty) {
        case 'easy': numPairs = 6; break;
        case 'medium': numPairs = 8; break;
        case 'hard': numPairs = 12; break;
        default: numPairs = 8;
    }

    const shuffledIcons = [...allTechIcons].sort(() => Math.random() - 0.5).slice(0, numPairs);
    const duplicated = [...shuffledIcons, ...shuffledIcons]
      .sort(() => Math.random() - 0.5)
      .map((card) => ({ ...card, uniqueId: Math.random() }));
    
    setCards(duplicated);
    setDifficulty(selectedDifficulty);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
    setWon(false);
    setIsNewRecord(false);
    setDisabled(false);
    setGameActive(true);
  };

  const handleClick = (id) => {
    if (disabled || flipped.includes(id) || solved.includes(id)) return;

    if (flipped.length === 0) {
      setFlipped([id]);
      return;
    }

    if (flipped.length === 1) {
      setDisabled(true);
      setFlipped([...flipped, id]);
      setMoves((prev) => prev + 1);
      checkForMatch(id);
    }
  };

  const checkForMatch = (secondId) => {
    const firstId = flipped[0];
    const firstCard = cards.find((card) => card.uniqueId === firstId);
    const secondCard = cards.find((card) => card.uniqueId === secondId);

    if (firstCard.id === secondCard.id) {
      setSolved((prev) => [...prev, firstId, secondId]);
      setFlipped([]);
      setDisabled(false);
    } else {
      setTimeout(() => {
        setFlipped([]);
        setDisabled(false);
      }, 1000);
    }
  };

  useEffect(() => {
    if (gameActive && cards.length > 0 && solved.length === cards.length) {
      setTimeout(() => handleWin(), 500);
    }
  }, [solved, cards]);

  const handleWin = () => {
    setWon(true);
    if (moves < records[difficulty]) {
        const newRecords = { ...records, [difficulty]: moves };
        setRecords(newRecords);
        localStorage.setItem('techMemoryRecords', JSON.stringify(newRecords));
        setIsNewRecord(true);
    }
  };

  const handleBack = () => {
    if (gameActive) {
        setGameActive(false);
        setWon(false);
    } else if (onBack) {
        onBack();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center">
        
        {/* Botão de Voltar */}
        <div className="absolute top-6 left-6 z-20">
            <button 
                onClick={handleBack} 
                className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
            >
                <Icon icon="solar:arrow-left-bold" /> {gameActive ? common?.quit : common?.back}
            </button>
        </div>

        <div className="text-center mb-8 relative z-10 mt-8">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Icon icon="solar:sd-card-bold-duotone" className="text-primary animate-pulse" />
            <span className="text-white">{txt?.title}</span>
          </h2>
          {!gameActive && <p className="text-gray-400 text-sm">{txt?.subtitle}</p>}
        </div>

        {/* --- MENU DE SELEÇÃO --- */}
        {!gameActive && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg z-10">
                {['easy', 'medium', 'hard'].map((level) => (
                    <button
                        key={level}
                        onClick={() => startGame(level)}
                        className="group relative bg-surface/50 border border-white/10 hover:border-primary/50 p-6 rounded-2xl transition-all hover:-translate-y-1"
                    >
                        <div className="absolute top-2 right-2 text-xs text-gray-500 font-mono flex gap-1">
                           <span>{txt?.bestScore}:</span>
                           <span className={records[level] === 999 ? "text-gray-600" : "text-primary"}>
                             {records[level] === 999 ? '-' : records[level]}
                           </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-1 capitalize group-hover:text-primary transition-colors">
                            {txt?.modes?.[level]}
                        </h3>
                        
                        <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full ${level === 'easy' ? 'bg-green-500 w-1/3' : level === 'medium' ? 'bg-yellow-500 w-2/3' : 'bg-red-500 w-full'}`}></div>
                        </div>
                    </button>
                ))}
            </div>
        )}

        {/* --- ÁREA DO JOGO --- */}
        {gameActive && (
            <div className="w-full z-10 flex flex-col items-center">
                {/* Placar */}
                <div className="flex justify-between items-center w-full max-w-lg mb-6 px-4 bg-black/20 py-2 rounded-full border border-white/5">
                    <div className="flex items-center gap-4 mx-auto text-sm">
                        <div className="text-white font-mono">
                            {txt?.moves}: <span className="text-primary font-bold">{moves}</span>
                        </div>
                        <div className="text-white/50 font-mono border-l border-white/10 pl-4">
                            {txt?.bestScore}: {records[difficulty] === 999 ? '-' : records[difficulty]}
                        </div>
                    </div>
                    <button onClick={() => startGame(difficulty)} className="text-primary hover:text-white transition-colors" title={common?.restart}>
                        <Icon icon="solar:refresh-circle-bold" size={24} />
                    </button>
                </div>

                <div className={`grid gap-3 md:gap-4 max-w-2xl mx-auto 
                    ${difficulty === 'easy' ? 'grid-cols-3 sm:grid-cols-4' : 
                      difficulty === 'medium' ? 'grid-cols-4' : 
                      'grid-cols-4 sm:grid-cols-6'}`}>
                {cards.map((card) => {
                    const isFlipped = flipped.includes(card.uniqueId) || solved.includes(card.uniqueId);
                    return (
                    <div 
                        key={card.uniqueId} 
                        className="aspect-square cursor-pointer relative perspective-1000 w-16 h-16 sm:w-20 sm:h-20"
                        onClick={() => handleClick(card.uniqueId)}
                    >
                        <motion.div
                            initial={false}
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full relative preserve-3d"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            <div className="absolute inset-0 w-full h-full bg-surface border border-white/10 rounded-xl flex items-center justify-center backface-hidden shadow-lg hover:border-primary/50 transition-colors z-20">
                                <Icon icon="solar:code-square-bold" className="text-gray-600 text-2xl opacity-50" />
                            </div>
                            <div 
                                className={`absolute inset-0 w-full h-full rounded-xl flex items-center justify-center backface-hidden border-2 shadow-xl ${
                                    solved.includes(card.uniqueId) 
                                    ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(255,209,0,0.3)]' 
                                    : 'bg-[#1a1a1a] border-white/20'
                                }`}
                                style={{ transform: 'rotateY(180deg)', backgroundColor: '#1a1a1a' }}
                            >
                                <Icon icon={card.icon} className="text-3xl text-white drop-shadow-md" />
                            </div>
                        </motion.div>
                    </div>
                    );
                })}
                </div>
            </div>
        )}

        {/* --- OVERLAY DE VITÓRIA --- */}
        <AnimatePresence>
            {won && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 rounded-3xl"
                >
                    <div className="bg-surface border border-primary/50 p-8 rounded-2xl text-center shadow-2xl relative overflow-hidden">
                         {isNewRecord && (
                            <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold py-1 animate-pulse">
                                {txt?.newRecord}
                            </div>
                        )}

                        <h3 className="text-2xl font-bold text-white mb-2 mt-4">{txt?.winTitle}</h3>
                        <p className="text-gray-300 mb-6">{txt?.winSubtitle} <span className="text-primary font-bold">{moves}</span> {txt?.moves?.toLowerCase()}.</p>
                        
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => startGame(difficulty)}
                                className="w-full bg-primary text-bg font-bold px-6 py-3 rounded-xl hover:bg-yellow-400"
                            >
                                {txt?.playAgain}
                            </button>
                            <button 
                                onClick={() => { setWon(false); setGameActive(false); }}
                                className="w-full bg-transparent border border-white/20 text-white font-bold px-6 py-2 rounded-xl hover:bg-white/10 text-sm"
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