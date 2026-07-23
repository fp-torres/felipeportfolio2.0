import { lazy, Suspense, useState } from 'react';
import { useLanguage } from '../../context/useLanguage';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion as Motion } from 'framer-motion';

const GAME_COMPONENTS = {
  memory: lazy(() => import('../games/TechMemoryGame')),
  snake: lazy(() => import('../games/SnakeGame')),
  sequence: lazy(() => import('../games/CyberSequence')),
  matrix: lazy(() => import('../games/MatrixRecall')),
  decryptor: lazy(() => import('../games/Decryptor')),
  zip: lazy(() => import('../games/ZipGame')),
};

const GAME_META = [
  { id: 'memory', icon: 'solar:sd-card-bold-duotone', color: 'from-blue-500 to-cyan-500' },
  { id: 'snake', icon: 'solar:gamepad-bold-duotone', color: 'from-green-500 to-emerald-500' },
  { id: 'sequence', icon: 'solar:soundwave-bold-duotone', color: 'from-purple-500 to-pink-500' },
  { id: 'matrix', icon: 'solar:widget-bold-duotone', color: 'from-cyan-400 to-teal-500' },
  { id: 'decryptor', icon: 'solar:shield-keyhole-bold-duotone', color: 'from-red-500 to-pink-600' },
  { id: 'zip', icon: 'solar:code-scan-bold-duotone', color: 'from-gray-600 to-gray-500' },
];

function GameLoading() {
  return (
    <div className="min-h-[420px] flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-surface/30">
      <Icon icon="svg-spinners:blocks-shuffle-3" className="text-4xl text-primary" />
      <span className="text-xs font-mono text-gray-500">LOADING_GAME...</span>
    </div>
  );
}

export default function GameHub() {
  const { t } = useLanguage();
  const [activeGame, setActiveGame] = useState(null);
  const ActiveGame = activeGame ? GAME_COMPONENTS[activeGame] : null;

  const games = GAME_META.map((game) => {
    const text = t?.minigames?.descriptions?.[game.id] ?? {
      title: game.id,
      desc: '...',
    };

    return { ...game, ...text };
  });

  return (
    <section id="minigames" className="py-12 sm:py-20 px-1 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Icon icon="solar:gamepad-charge-bold" className="text-primary" />
            <span className="text-white">{t?.minigames?.sectionTitle}</span>
          </h2>
          <p className="text-gray-400">{t?.minigames?.sectionSubtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          {!activeGame ? (
            <Motion.div
              key="catalog"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {games.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setActiveGame(game.id)}
                  className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-left border border-white/10 transition-all duration-300 group hover:border-primary/50 sm:hover:-translate-y-2 hover:shadow-2xl bg-surface/40 min-h-48 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon icon={game.icon} className="text-white text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{game.desc}</p>
                </button>
              ))}
            </Motion.div>
          ) : (
            <Motion.div
              key={activeGame}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <Suspense fallback={<GameLoading />}>
                <ActiveGame onBack={() => setActiveGame(null)} />
              </Suspense>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
