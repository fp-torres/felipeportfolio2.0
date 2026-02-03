import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // Importando o contexto
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const techIcons = [
  { id: 1, icon: "devicon:react", name: "React" },
  { id: 2, icon: "devicon:python", name: "Python" },
  { id: 3, icon: "devicon:javascript", name: "JS" },
  { id: 4, icon: "devicon:typescript", name: "TS" },
  { id: 5, icon: "devicon:linux", name: "Linux" },
  { id: 6, icon: "devicon:docker", name: "Docker" },
  { id: 7, icon: "devicon:mysql", name: "MySQL" },
  { id: 8, icon: "devicon:git", name: "Git" },
];

export default function TechMemoryGame() {
  const { t } = useLanguage(); // Usando as traduções
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const initializeGame = () => {
    const duplicated = [...techIcons, ...techIcons]
      .sort(() => Math.random() - 0.5)
      .map((card) => ({ ...card, uniqueId: Math.random() })); 
    
    setCards(duplicated);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
    setWon(false);
    setDisabled(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

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
    if (cards.length > 0 && solved.length === cards.length) {
      setTimeout(() => setWon(true), 500);
    }
  }, [solved, cards]);

  return (
    <section id="minigame" className="py-20 px-4">
      <div className="max-w-4xl mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Icon icon="solar:gamepad-bold" className="text-primary animate-pulse" />
            <span className="text-white">{t.minigame.title}</span>
          </h2>
          <p className="text-gray-400 text-sm">{t.minigame.subtitle}</p>
        </div>

        <div className="flex justify-between items-center max-w-md mx-auto mb-8 px-4 bg-black/20 py-2 rounded-full border border-white/5 relative z-10">
            <div className="flex items-center gap-2">
                <Icon icon="solar:refresh-circle-bold" className="text-primary" />
                <span className="text-white font-mono text-sm">{t.minigame.moves}: <span className="text-primary font-bold">{moves}</span></span>
            </div>
            <button 
                onClick={initializeGame}
                className="text-xs font-bold text-white bg-white/10 px-4 py-1.5 rounded-full hover:bg-primary hover:text-bg transition-colors"
            >
                {t.minigame.restart}
            </button>
        </div>

        {/* Tabuleiro */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 md:gap-4 max-w-lg mx-auto relative z-10">
          {cards.map((card) => {
             const isFlipped = flipped.includes(card.uniqueId) || solved.includes(card.uniqueId);
             
             return (
              <div 
                  key={card.uniqueId} 
                  className="aspect-square cursor-pointer relative perspective-1000"
                  onClick={() => handleClick(card.uniqueId)}
              >
                  <motion.div
                      initial={false}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full relative preserve-3d"
                      style={{ transformStyle: 'preserve-3d' }}
                  >
                      {/* FRENTE (Logo/Interrogação) */}
                      <div className="absolute inset-0 w-full h-full bg-surface border border-white/10 rounded-xl flex flex-col items-center justify-center backface-hidden shadow-lg hover:border-primary/50 transition-colors z-20">
                          <Icon icon="solar:code-square-bold" className="text-gray-600 text-3xl opacity-50" />
                      </div>

                      {/* VERSO (Ícone da Tech) */}
                      <div 
                          className={`absolute inset-0 w-full h-full rounded-xl flex flex-col items-center justify-center backface-hidden border-2 shadow-xl ${
                              solved.includes(card.uniqueId) 
                              ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(255,209,0,0.3)]' 
                              : 'bg-[#1a1a1a] border-white/20'
                          }`}
                          style={{ 
                              transform: 'rotateY(180deg)',
                              backgroundColor: '#1a1a1a' 
                          }}
                      >
                          <Icon icon={card.icon} className="text-4xl md:text-5xl text-white drop-shadow-md" />
                      </div>
                  </motion.div>
              </div>
             );
          })}
        </div>

        {/* Overlay Vitória */}
        <AnimatePresence>
            {won && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 rounded-3xl"
                >
                    <motion.div 
                        initial={{ scale: 0.5, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-surface border border-primary/50 p-8 rounded-2xl text-center shadow-2xl max-w-xs mx-4"
                    >
                        <Icon icon="solar:cup-star-bold" className="text-primary text-6xl mx-auto mb-4 drop-shadow-[0_0_10px_rgba(255,209,0,0.5)]" />
                        <h3 className="text-2xl font-bold text-white mb-2">{t.minigame.winTitle}</h3>
                        <p className="text-gray-300 mb-6">{t.minigame.winSubtitle} <span className="text-primary font-bold">{moves}</span> {t.minigame.moves.toLowerCase()}.</p>
                        
                        <button 
                            onClick={initializeGame}
                            className="w-full bg-primary text-bg font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:restart-bold" />
                            {t.minigame.playAgain}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </section>
  );
}