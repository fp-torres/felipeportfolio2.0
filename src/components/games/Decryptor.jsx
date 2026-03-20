import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const SYMBOLS = [
  { id: 'A', icon: 'solar:code-circle-bold',    color: 'text-green-400'  },
  { id: 'B', icon: 'solar:shield-warning-bold',  color: 'text-red-400'   },
  { id: 'C', icon: 'solar:cpu-bolt-bold',        color: 'text-blue-400'  },
  { id: 'D', icon: 'solar:wi-fi-router-bold',    color: 'text-yellow-400'},
  { id: 'E', icon: 'solar:database-bold',        color: 'text-purple-400'},
  { id: 'F', icon: 'solar:lock-password-bold',   color: 'text-orange-400'},
];

export default function Decryptor({ onBack }) {
  const { t } = useLanguage();

  const common = t?.minigames?.common;
  const txt    = t?.minigames?.decryptor;

  const getLevelConfig = (level) => {
    if (level === 1) return { slots: 3, options: 4, tries: 8  };
    if (level === 2) return { slots: 4, options: 5, tries: 10 };
    return               { slots: 5, options: 6, tries: 12 };
  };

  const [level,        setLevel]        = useState(1);
  const [secretCode,   setSecretCode]   = useState([]);
  const [guesses,      setGuesses]      = useState([]);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [gameStatus,   setGameStatus]   = useState('playing');
  const [highScore,    setHighScore]    = useState(1);
  const [hintUsed,     setHintUsed]     = useState(false);
  const [hintReveal,   setHintReveal]   = useState(null); // { index, symbol }

  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('decryptorRecord');
    if (saved) setHighScore(parseInt(saved));
    startLevel(1);
  }, []);

  // Auto-scroll no histórico
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [guesses, currentGuess]);

  // ─── Inicializa nível ────────────────────────────────────────────────────────
  const startLevel = (lvl) => {
    const config = getLevelConfig(lvl);
    const newCode = Array.from({ length: config.slots }, () =>
      SYMBOLS[Math.floor(Math.random() * config.options)]
    );
    setSecretCode(newCode);
    setGuesses([]);
    setCurrentGuess([]);
    setGameStatus('playing');
    setLevel(lvl);
    setHintUsed(false);
    setHintReveal(null);
  };

  // ─── Teclado ─────────────────────────────────────────────────────────────────
  const handleSelectSymbol = (symbol) => {
    if (gameStatus !== 'playing') return;
    const config = getLevelConfig(level);
    if (currentGuess.length < config.slots) {
      setCurrentGuess(prev => [...prev, symbol]);
    }
  };

  const handleBackspace = () => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  // ─── Dica: revela o símbolo da posição 0 e custa 1 tentativa ─────────────────
  const handleHint = () => {
    if (gameStatus !== 'playing' || hintUsed) return;
    const config = getLevelConfig(level);
    if (guesses.length + 1 >= config.tries) return; // sem dica na última chance

    setHintUsed(true);

    // Encontra a primeira posição ainda não acertada por alguma tentativa anterior
    let revealIdx = 0;
    for (let i = 0; i < config.slots; i++) {
      const alreadyExact = guesses.some(g => g.guess[i]?.id === secretCode[i]?.id);
      if (!alreadyExact) { revealIdx = i; break; }
    }

    const revealed = { index: revealIdx, symbol: secretCode[revealIdx] };
    setHintReveal(revealed);

    // Adiciona linha especial de dica no histórico (conta como tentativa)
    setGuesses(prev => [
      ...prev,
      { isHint: true, hintReveal: revealed, guess: [], exact: 0, partial: 0 },
    ]);
  };

  // ─── Submete tentativa ───────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (gameStatus !== 'playing') return;
    const config = getLevelConfig(level);
    if (currentGuess.length !== config.slots) return;

    let exactMatches   = 0;
    let partialMatches = 0;
    const tempSecret = [...secretCode];
    const tempGuess  = [...currentGuess];

    // Passo 1 – posição exata
    for (let i = 0; i < config.slots; i++) {
      if (tempGuess[i].id === tempSecret[i].id) {
        exactMatches++;
        tempSecret[i] = null;
        tempGuess[i]  = 'MATCHED';
      }
    }
    // Passo 2 – símbolo certo, posição errada
    for (let i = 0; i < config.slots; i++) {
      if (tempGuess[i] === 'MATCHED') continue;
      const fi = tempSecret.findIndex(s => s && s.id === tempGuess[i].id);
      if (fi !== -1) { partialMatches++; tempSecret[fi] = null; }
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

  const config      = getLevelConfig(level);
  const currentOpts = SYMBOLS.slice(0, config.options);
  const isRowFull   = currentGuess.length === config.slots;
  const attemptsUsed = guesses.length;
  const progressPct  = Math.min((attemptsUsed / config.tries) * 100, 100);
  const progressColor =
    progressPct > 75 ? 'bg-red-500' :
    progressPct > 50 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0F172A] rounded-3xl border border-white/10 p-4 shadow-2xl relative flex flex-col h-[85vh] max-h-[700px]">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-2 shrink-0">
        <button onClick={onBack} className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold">
          <Icon icon="solar:arrow-left-bold" /> {common?.exit}
        </button>

        <div className="flex gap-2 items-center">
          {/* Botão de dica */}
          <button
            onPointerDown={(e) => { e.preventDefault(); handleHint(); }}
            disabled={hintUsed || gameStatus !== 'playing'}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-all touch-none ${
              hintUsed || gameStatus !== 'playing'
                ? 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed'
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
            }`}
          >
            <Icon icon="solar:eye-bold" />
            {hintUsed ? (txt?.hintUsed || 'Usada') : (txt?.hint || 'Dica')}
          </button>

          <div className="text-white font-mono text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/30">
            {common?.level} {level}
          </div>
          <div className="text-gray-400 font-mono text-xs bg-white/5 px-3 py-1 rounded-lg border border-white/10">
            Max: {highScore}
          </div>
        </div>
      </div>

      {/* ── Legenda (i18n com fallback) ── */}
      <div className="flex justify-center gap-4 mb-2 text-[10px] text-gray-400 bg-black/20 py-1 rounded-lg shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
          <span>{txt?.exactMatch   || 'Posição Correta'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_#eab308]" />
          <span>{txt?.partialMatch || 'Cor Certa, Lugar Errado'}</span>
        </div>
      </div>

      {/* ── Barra de progresso de tentativas ── */}
      <div className="w-full bg-white/5 rounded-full h-1.5 mb-2 shrink-0 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Histórico (scrollável) ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 bg-black/20 rounded-xl p-2 border border-white/5"
      >
        {guesses.length === 0 && gameStatus === 'playing' && (
          <div className="text-center text-gray-500 text-xs mt-10 opacity-50">
            {txt?.placeholder || 'Selecione os ícones abaixo para tentar descobrir a senha.'}
          </div>
        )}

        {guesses.map((turn, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-2 rounded-lg border ${
              turn.isHint
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-white/5 border-white/5'
            }`}
          >
            {turn.isHint ? (
              /* Linha especial de dica */
              <div className="flex items-center gap-2 text-yellow-400 text-xs w-full">
                <Icon icon="solar:eye-bold" />
                <span>{txt?.hintRow || 'Dica: posição'} {turn.hintReveal.index + 1} =</span>
                <div className="w-7 h-7 rounded bg-black/40 flex items-center justify-center">
                  <Icon icon={turn.hintReveal.symbol.icon} className={turn.hintReveal.symbol.color} />
                </div>
                <span className="ml-auto text-yellow-600 text-[10px]">−1 tentativa</span>
              </div>
            ) : (
              <>
                {/* Símbolos da tentativa */}
                <div className="flex gap-1 sm:gap-2">
                  {turn.guess.map((s, i) => (
                    <div key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-black/40 flex items-center justify-center">
                      <Icon icon={s.icon} className={s.color} />
                    </div>
                  ))}
                </div>
                {/* Feedback visual */}
                <div className="flex gap-1 ml-2 flex-wrap justify-end max-w-[60px]">
                  {[...Array(turn.exact)].map((_, i) =>
                    <div key={`e${i}`} className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
                  )}
                  {[...Array(turn.partial)].map((_, i) =>
                    <div key={`p${i}`} className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_5px_#eab308]" />
                  )}
                  {[...Array(config.slots - turn.exact - turn.partial)].map((_, i) =>
                    <div key={`w${i}`} className="w-3 h-3 rounded-full bg-gray-700" />
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {/* ── Linha ativa (input) ── */}
        {gameStatus === 'playing' && (
          <div className="flex items-center justify-between bg-primary/10 p-2 rounded-lg border border-primary/30">
            <div className="flex gap-1 sm:gap-2">
              {[...Array(config.slots)].map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded bg-black/40 flex items-center justify-center border transition-colors ${
                    currentGuess[i] ? 'border-white/20' : 'border-primary/30'
                  }`}
                >
                  {currentGuess[i] ? (
                    <Icon icon={currentGuess[i].icon} className={currentGuess[i].color} />
                  ) : i === currentGuess.length ? (
                    /* Cursor piscante apenas no próximo slot vazio */
                    <span className="w-0.5 h-4 bg-primary animate-pulse rounded-full" />
                  ) : (
                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                  )}
                </div>
              ))}
            </div>
            <div className="text-xs text-primary font-bold font-mono">
              {guesses.length + 1}/{config.tries}
            </div>
          </div>
        )}
      </div>

      {/* ── Overlay de fim de jogo (fixed para não esconder atrás do teclado) ── */}
      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-4 top-1/4 z-50 max-w-lg mx-auto bg-[#1e293b] border border-white/20 p-6 rounded-2xl shadow-2xl text-center"
          >
            {gameStatus === 'won' ? (
              <>
                <Icon icon="solar:lock-unlocked-bold" className="text-green-400 text-5xl mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-white mb-2">{txt?.accessGranted}</h3>
                <p className="text-gray-400 text-sm mb-4">{txt?.cracked}</p>
                <button
                  onClick={() => startLevel(level + 1)}
                  className="w-full bg-green-500 text-black font-bold py-3 rounded-xl hover:bg-green-400 transition-colors"
                >
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
                <button
                  onClick={() => startLevel(level)}
                  className="w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors"
                >
                  {common?.tryAgain}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Teclado ── */}
      <div className="grid grid-cols-4 gap-2 mt-auto pt-2 border-t border-white/5 shrink-0">
        {currentOpts.map((symbol) => (
          <button
            key={symbol.id}
            onPointerDown={(e) => { e.preventDefault(); handleSelectSymbol(symbol); }}
            disabled={gameStatus !== 'playing'}
            className="bg-black/30 hover:bg-white/10 p-3 rounded-xl flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 touch-none"
          >
            <Icon icon={symbol.icon} className={`${symbol.color} text-2xl`} />
          </button>
        ))}

        <button
          onPointerDown={(e) => { e.preventDefault(); handleBackspace(); }}
          disabled={gameStatus !== 'playing'}
          className="col-span-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl py-3 flex items-center justify-center active:scale-95 touch-none"
        >
          <Icon icon="solar:backspace-bold" className="text-xl" />
        </button>

        <button
          onPointerDown={(e) => { e.preventDefault(); handleSubmit(); }}
          disabled={gameStatus !== 'playing' || !isRowFull}
          className={`col-span-2 rounded-xl py-3 flex items-center justify-center active:scale-95 font-bold transition-all touch-none ${
            isRowFull
              ? 'bg-primary text-bg hover:bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {txt?.enter}
        </button>
      </div>
    </div>
  );
}