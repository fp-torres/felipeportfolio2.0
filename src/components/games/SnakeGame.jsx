import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';

const GRID_SIZE = 20;
const BASE_SPEED = 150;
const MIN_SPEED   = 65;  // velocidade máxima (ms menor = mais rápido)

// Chance (%) de a próxima comida ser especial (dourada, vale 30pts)
const GOLDEN_CHANCE = 0.18;

export default function SnakeGame({ onBack }) {
  const { t } = useLanguage();

  const [snake,       setSnake]       = useState([{ x: 10, y: 10 }]);
  const [food,        setFood]        = useState({ x: 15, y: 15, golden: false });
  const [gameOver,    setGameOver]    = useState(false);
  const [score,       setScore]       = useState(0);
  const [highScore,   setHighScore]   = useState(0);
  const [isPaused,    setIsPaused]    = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [started,     setStarted]     = useState(false);
  const [level,       setLevel]       = useState(1);

  // ─── Refs (evitam stale closures no game loop) ───────────────────────────────
  const dirRef       = useRef('RIGHT');
  const nextDirRef   = useRef('RIGHT'); // buffer: evita 180° em 2 teclas rápidas
  const snakeRef     = useRef([{ x: 10, y: 10 }]);
  const foodRef      = useRef({ x: 15, y: 15, golden: false });
  const scoreRef     = useRef(0);
  const highScoreRef = useRef(0);
  const gameOverRef  = useRef(false);
  const isPausedRef  = useRef(false);
  const loopRef      = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) {
      const n = parseInt(saved);
      setHighScore(n);
      highScoreRef.current = n;
    }
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const generateFood = useCallback((currentSnake) => {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        golden: Math.random() < GOLDEN_CHANCE,
      };
    } while (currentSnake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }, []);

  const calcSpeed = (sc) => Math.max(MIN_SPEED, BASE_SPEED - Math.floor(sc / 50) * 10);
  const calcLevel = (sc) => Math.floor(sc / 50) + 1;

  // ─── Game loop principal (usa só refs, zero closures) ────────────────────────
  const tick = useCallback(() => {
    if (gameOverRef.current || isPausedRef.current) return;

    // Confirma direção buffered
    dirRef.current = nextDirRef.current;

    const prev = snakeRef.current;
    const head = { ...prev[0] };

    switch (dirRef.current) {
      case 'UP':    head.y -= 1; break;
      case 'DOWN':  head.y += 1; break;
      case 'LEFT':  head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Colisão parede
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame(); return;
    }
    // Colisão corpo
    if (prev.some(s => s.x === head.x && s.y === head.y)) {
      endGame(); return;
    }

    const next = [head, ...prev];
    const curFood = foodRef.current;

    if (head.x === curFood.x && head.y === curFood.y) {
      // Comeu!
      const pts       = curFood.golden ? 30 : 10;
      const newScore  = scoreRef.current + pts;
      scoreRef.current = newScore;

      const newFood = generateFood(next);
      foodRef.current = newFood;
      snakeRef.current = next;

      setScore(newScore);
      setFood({ ...newFood });
      setLevel(calcLevel(newScore));

      if (newScore > highScoreRef.current) {
        highScoreRef.current = newScore;
        localStorage.setItem('snakeHighScore', newScore.toString());
        setHighScore(newScore);
        setIsNewRecord(true);
      }

      // Reinicia loop com nova velocidade
      restartLoop(calcSpeed(newScore));
    } else {
      next.pop();
      snakeRef.current = next;
      setSnake([...next]);
    }
  }, [generateFood]);

  const restartLoop = useCallback((speed) => {
    clearInterval(loopRef.current);
    loopRef.current = setInterval(tick, speed);
  }, [tick]);

  const endGame = () => {
    gameOverRef.current = true;
    clearInterval(loopRef.current);
    setGameOver(true);
  };

  // ─── Inicia / reinicia ────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearInterval(loopRef.current);

    const initSnake = [{ x: 10, y: 10 }];
    const initFood  = generateFood(initSnake);

    snakeRef.current  = initSnake;
    foodRef.current   = initFood;
    scoreRef.current  = 0;
    dirRef.current    = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    gameOverRef.current = false;
    isPausedRef.current = false;

    setSnake(initSnake);
    setFood(initFood);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setIsNewRecord(false);
    setStarted(true);

    loopRef.current = setInterval(tick, BASE_SPEED);
  }, [generateFood, tick]);

  useEffect(() => () => clearInterval(loopRef.current), []);

  // ─── Controles teclado ───────────────────────────────────────────────────────
  useEffect(() => {
    const OPPOSITES = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    const MAP = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
    };

    const onKey = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();

      if (e.key === ' ' || e.key === 'Escape') {
        togglePause(); return;
      }

      const newDir = MAP[e.key];
      if (!newDir) return;
      if (newDir !== OPPOSITES[dirRef.current]) {
        nextDirRef.current = newDir;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const togglePause = () => {
    if (gameOverRef.current || !started) return;
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
    if (!next) restartLoop(calcSpeed(scoreRef.current));
    else clearInterval(loopRef.current);
  };

  // ─── Controle direcional mobile ──────────────────────────────────────────────
  const mobileDir = (dir) => {
    const OPPOSITES = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (dir !== OPPOSITES[dirRef.current]) nextDirRef.current = dir;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  const snakeSet = new Set(snakeRef.current.map(s => `${s.x},${s.y}`));
  const headKey  = `${snakeRef.current[0]?.x},${snakeRef.current[0]?.y}`;

  return (
    <div className="w-full max-w-lg mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl relative">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-white/50 hover:text-white flex items-center gap-2 transition-colors text-sm font-bold">
          <Icon icon="solar:arrow-left-bold" /> Sair
        </button>

        <div className="flex gap-2 items-center">
          {/* Nível */}
          <div className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
            Nv. {level}
          </div>
          <div className="text-white font-mono text-sm bg-black/30 px-3 py-1 rounded-lg border border-white/5">
            Score: <span className="text-primary font-bold">{score}</span>
          </div>
          <div className={`font-mono text-sm px-3 py-1 rounded-lg border transition-all ${
            isNewRecord
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 animate-pulse'
              : 'bg-black/30 border-white/5 text-white'
          }`}>
            Rec: <span className="font-bold">{highScore}</span>
          </div>
          <button
            onPointerDown={() => togglePause()}
            className="text-white hover:text-primary transition-colors"
            disabled={!started || gameOver}
          >
            <Icon icon={isPaused ? 'solar:play-bold' : 'solar:pause-bold'} width="22" />
          </button>
        </div>
      </div>

      {/* ── Tabuleiro ── */}
      <div className="relative aspect-square bg-black/40 rounded-xl border border-white/20 overflow-hidden mx-auto max-w-[300px] sm:max-w-[400px] shadow-inner">

        {/* Grid renderizado em canvas-like com divs absolutas para evitar reflow de 400 filhos */}
        <div className="relative w-full h-full">
          {snakeRef.current.map((seg, i) => {
            const isHead = i === 0;
            return (
              <div
                key={`s${seg.x}-${seg.y}-${i}`}
                className={`absolute transition-none ${
                  isHead
                    ? 'bg-primary rounded-sm z-10'
                    : 'bg-green-500/60 rounded-sm'
                }`}
                style={{
                  left:   `${(seg.x / GRID_SIZE) * 100}%`,
                  top:    `${(seg.y / GRID_SIZE) * 100}%`,
                  width:  `${(1 / GRID_SIZE) * 100}%`,
                  height: `${(1 / GRID_SIZE) * 100}%`,
                  transform: isHead ? 'scale(1.12)' : undefined,
                }}
              />
            );
          })}

          {/* Comida */}
          <div
            className={`absolute rounded-full z-5 transition-none ${
              food.golden
                ? 'bg-yellow-300 shadow-[0_0_12px_#fde047] animate-pulse'
                : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse'
            }`}
            style={{
              left:   `${(food.x / GRID_SIZE) * 100}%`,
              top:    `${(food.y / GRID_SIZE) * 100}%`,
              width:  `${(1 / GRID_SIZE) * 100}%`,
              height: `${(1 / GRID_SIZE) * 100}%`,
            }}
          />
        </div>

        {/* Tela inicial */}
        {!started && !gameOver && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-4">
            <Icon icon="solar:gamepad-bold" className="text-primary text-5xl" />
            <button
              onPointerDown={startGame}
              className="bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
            >
              <Icon icon="solar:play-bold" /> Iniciar
            </button>
            <p className="text-gray-400 text-xs">WASD ou Setas para mover • Espaço para pausar</p>
          </div>
        )}

        {/* Pausa */}
        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-3">
            <Icon icon="solar:pause-circle-bold" className="text-white text-6xl opacity-80" />
            <p className="text-gray-400 text-sm">Pressione Espaço para continuar</p>
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-in fade-in duration-300 gap-2">
            <h3 className="text-3xl font-bold text-red-500">Game Over!</h3>
            {isNewRecord && (
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest animate-bounce">
                🏆 Novo Recorde!
              </span>
            )}
            <p className="text-gray-300 font-mono">
              Pontuação: <span className="text-white font-bold text-xl">{score}</span>
            </p>
            <p className="text-gray-500 text-xs font-mono">Nível {level} atingido</p>
            <button
              onPointerDown={startGame}
              className="mt-2 bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(255,209,0,0.3)]"
            >
              <Icon icon="solar:restart-bold" /> Tentar Novamente
            </button>
          </div>
        )}
      </div>

      {/* ── Controles Mobile ── */}
      <div className="mt-6 grid grid-cols-3 gap-2 max-w-[160px] mx-auto md:hidden">
        <div />
        <button
          onPointerDown={(e) => { e.preventDefault(); mobileDir('UP'); }}
          className="bg-white/10 p-3 rounded-2xl active:bg-primary active:text-bg transition-colors flex items-center justify-center"
        >
          <Icon icon="solar:arrow-up-bold" className="text-white text-xl" />
        </button>
        <div />

        <button
          onPointerDown={(e) => { e.preventDefault(); mobileDir('LEFT'); }}
          className="bg-white/10 p-3 rounded-2xl active:bg-primary active:text-bg transition-colors flex items-center justify-center"
        >
          <Icon icon="solar:arrow-left-bold" className="text-white text-xl" />
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); togglePause(); }}
          className="bg-white/5 p-3 rounded-2xl active:bg-white/20 transition-colors flex items-center justify-center"
        >
          <Icon icon={isPaused ? 'solar:play-bold' : 'solar:pause-bold'} className="text-white/60 text-lg" />
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); mobileDir('RIGHT'); }}
          className="bg-white/10 p-3 rounded-2xl active:bg-primary active:text-bg transition-colors flex items-center justify-center"
        >
          <Icon icon="solar:arrow-right-bold" className="text-white text-xl" />
        </button>

        <div />
        <button
          onPointerDown={(e) => { e.preventDefault(); mobileDir('DOWN'); }}
          className="bg-white/10 p-3 rounded-2xl active:bg-primary active:text-bg transition-colors flex items-center justify-center"
        >
          <Icon icon="solar:arrow-down-bold" className="text-white text-xl" />
        </button>
        <div />
      </div>

      {/* Legenda comida dourada */}
      <p className="text-center text-xs text-gray-600 mt-3 font-mono flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_6px_#fde047]" />
        Comida dourada = 30 pts
        <span className="mx-2 text-gray-700">|</span>
        <span className="hidden md:inline">WASD ou Setas • Espaço = pausa</span>
        <span className="md:hidden">D-pad para mover</span>
      </p>
    </div>
  );
}