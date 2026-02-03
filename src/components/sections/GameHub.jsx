import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

// Import dos Jogos Ativos
import TechMemoryGame from '../games/TechMemoryGame'; 
import SnakeGame from '../games/SnakeGame'; 
import CyberSequence from '../games/CyberSequence'; 
import ZipGame from '../games/ZipGame'; 
import Decryptor from '../games/Decryptor';
import MatrixRecall from '../games/MatrixRecall'; 

export default function GameHub() {
  const { t } = useLanguage();
  const [activeGame, setActiveGame] = useState(null); 

  // --- TRADUÇÃO SEGURA ---
  const getGameText = (key) => t?.minigames?.descriptions?.[key] || { title: key, desc: "..." };

  const games = [
    {
      id: 'memory',
      title: getGameText('memory').title,
      desc: getGameText('memory').desc,
      icon: 'solar:sd-card-bold-duotone',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'snake',
      title: getGameText('snake').title,
      desc: getGameText('snake').desc,
      icon: 'solar:gamepad-bold-duotone',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'sequence',
      title: getGameText('sequence').title,
      desc: getGameText('sequence').desc,
      icon: 'solar:soundwave-bold-duotone',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'matrix',
      title: getGameText('matrix').title,
      desc: getGameText('matrix').desc,
      icon: 'solar:widget-bold-duotone', 
      color: 'from-cyan-400 to-teal-500',
    },
    {
      id: 'decryptor',
      title: getGameText('decryptor').title,
      desc: getGameText('decryptor').desc,
      icon: 'solar:shield-keyhole-bold-duotone',
      color: 'from-red-500 to-pink-600',
    },
    {
      id: 'zip',
      title: getGameText('zip').title,
      desc: getGameText('zip').desc,
      icon: 'solar:code-scan-bold-duotone',
      color: 'from-gray-600 to-gray-500',
    }
  ];

  return (
    <section id="minigames" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Título da Seção */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Icon icon="solar:gamepad-charge-bold" className="text-primary" />
            <span className="text-white">{t?.minigames?.sectionTitle}</span>
          </h2>
          <p className="text-gray-400">{t?.minigames?.sectionSubtitle}</p>
        </div>

        {/* Área de Conteúdo */}
        <AnimatePresence mode="wait">
          
          {/* MODO CATÁLOGO */}
          {!activeGame && (
            <motion.div 
              key="catalog"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setActiveGame(game.id)}
                  className="relative overflow-hidden rounded-3xl p-6 text-left border border-white/10 transition-all duration-300 group hover:border-primary/50 hover:-translate-y-2 hover:shadow-2xl bg-surface/40"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                  
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon icon={game.icon} className="text-white text-2xl" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{game.desc}</p>
                </button>
              ))}
            </motion.div>
          )}

          {/* RENDERIZAÇÃO DOS JOGOS */}
          {activeGame === 'memory' && (
            <motion.div key="memory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <TechMemoryGame onBack={() => setActiveGame(null)} />
            </motion.div>
          )}

          {activeGame === 'snake' && (
            <motion.div key="snake" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SnakeGame onBack={() => setActiveGame(null)} />
            </motion.div>
          )}

          {activeGame === 'sequence' && (
            <motion.div key="sequence" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CyberSequence onBack={() => setActiveGame(null)} />
            </motion.div>
          )}

          {activeGame === 'matrix' && (
            <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MatrixRecall onBack={() => setActiveGame(null)} />
            </motion.div>
          )}

          {activeGame === 'decryptor' && (
            <motion.div key="decryptor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Decryptor onBack={() => setActiveGame(null)} />
            </motion.div>
          )}

          {activeGame === 'zip' && (
            <motion.div key="zip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ZipGame onBack={() => setActiveGame(null)} />
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </section>
  );
}