import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/useLanguage';
import { Icon } from '@iconify/react';

const GRID_SIZE    = 20;
const BASE_SPEED   = 150;
const MIN_SPEED    = 65;
const GOLDEN_CHANCE = 0.18;
const OPPOSITES = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
const KEY_DIRECTIONS = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  s: 'DOWN',
  a: 'LEFT',
  d: 'RIGHT',
};

const calcSpeed = (score) => Math.max(MIN_SPEED, BASE_SPEED - Math.floor(score / 50) * 10);
const calcLevel = (score) => Math.floor(score / 50) + 1;

function getSavedHighScore() {
  try {
    return Number.parseInt(localStorage.getItem('snakeHighScore') || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export default function SnakeGame({ onBack }) {
  const { t } = useLanguage();
  const txt    = t?.minigames?.snake;
  const common = t?.minigames?.common;

  const [snake,       setSnake]       = useState([{ x: 10, y: 10 }]);
  const [food,        setFood]        = useState({ x: 15, y: 15, golden: false });
  const [gameOver,    setGameOver]    = useState(false);
  const [score,       setScore]       = useState(0);
  const [highScore,   setHighScore]   = useState(getSavedHighScore);
  const [isPaused,    setIsPaused]    = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [started,     setStarted]     = useState(false);
  const [level,       setLevel]       = useState(1);
  const [isMobile] = useState(
    () => window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0,
  );

  const dirRef        = useRef('RIGHT');
  const nextDirRef    = useRef('RIGHT');
  const snakeRef      = useRef([{ x: 10, y: 10 }]);
  const foodRef       = useRef({ x: 15, y: 15, golden: false });
  const scoreRef      = useRef(0);
  const highScoreRef  = useRef(highScore);
  const gameOverRef   = useRef(false);
  const isPausedRef   = useRef(false);
  const loopRef       = useRef(null);
  const tickRef       = useRef(null);

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

  const scheduleNextTick = useCallback((speed) => {
    window.clearTimeout(loopRef.current);
    loopRef.current = window.setTimeout(() => tickRef.current?.(), speed);
  }, []);

  const endGame = useCallback(() => {
    gameOverRef.current = true;
    window.clearTimeout(loopRef.current);
    setGameOver(true);
  }, []);

  const tick = useCallback(() => {
    if (gameOverRef.current || isPausedRef.current) return;

    dirRef.current = nextDirRef.current;
    const prev = snakeRef.current;
    const head = { ...prev[0] };

    switch (dirRef.current) {
      case 'UP':    head.y -= 1; break;
      case 'DOWN':  head.y += 1; break;
      case 'LEFT':  head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame();
      return;
    }

    const currentFood = foodRef.current;
    const ateFood = head.x === currentFood.x && head.y === currentFood.y;
    const collisionBody = ateFood ? prev : prev.slice(0, -1);

    if (collisionBody.some((segment) => segment.x === head.x && segment.y === head.y)) {
      endGame();
      return;
    }

    const next = [head, ...prev];

    if (ateFood) {
      const pts      = currentFood.golden ? 30 : 10;
      const newScore = scoreRef.current + pts;
      scoreRef.current = newScore;

      const newFood = generateFood(next);
      foodRef.current  = newFood;
      snakeRef.current = next;

      setSnake([...next]);
      setScore(newScore);
      setFood({ ...newFood });
      setLevel(calcLevel(newScore));

      if (newScore > highScoreRef.current) {
        highScoreRef.current = newScore;
        localStorage.setItem('snakeHighScore', newScore.toString());
        setHighScore(newScore);
        setIsNewRecord(true);
      }
      scheduleNextTick(calcSpeed(newScore));
    } else {
      next.pop();
      snakeRef.current = next;
      setSnake([...next]);
      scheduleNextTick(calcSpeed(scoreRef.current));
    }
  }, [endGame, generateFood, scheduleNextTick]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const startGame = useCallback(() => {
    window.clearTimeout(loopRef.current);
    const initSnake = [{ x: 10, y: 10 }];
    const initFood  = generateFood(initSnake);

    snakeRef.current    = initSnake;
    foodRef.current     = initFood;
    scoreRef.current    = 0;
    dirRef.current      = 'RIGHT';
    nextDirRef.current  = 'RIGHT';
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

    scheduleNextTick(BASE_SPEED);
  }, [generateFood, scheduleNextTick]);

  const togglePause = useCallback(() => {
    if (gameOverRef.current || !started) return;
    const nextPaused = !isPausedRef.current;
    isPausedRef.current = nextPaused;
    setIsPaused(nextPaused);

    if (nextPaused) {
      window.clearTimeout(loopRef.current);
    } else {
      scheduleNextTick(calcSpeed(scoreRef.current));
    }
  }, [scheduleNextTick, started]);

  useEffect(() => () => window.clearTimeout(loopRef.current), []);

  useEffect(() => {
    const onKey = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === ' ' || event.key === 'Escape') {
        event.preventDefault();
        togglePause();
        return;
      }

      const newDir = KEY_DIRECTIONS[event.key] ?? KEY_DIRECTIONS[event.key.toLowerCase()];
      if (!newDir) return;
      if (newDir !== OPPOSITES[dirRef.current]) nextDirRef.current = newDir;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden && started && !gameOverRef.current && !isPausedRef.current) {
        togglePause();
      }
    };

    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [started, togglePause]);

  const mobileDir = (dir) => {
    if (dir !== OPPOSITES[dirRef.current]) nextDirRef.current = dir;
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-4 sm:p-6 shadow-2xl relative">

      {/* ── Title Banner ── */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 bg-black/30 border border-white/10 rounded-full px-4 py-1.5">
          <Icon icon="solar:gamepad-bold" className="text-primary text-sm" />
          <span className="text-sm font-bold text-white tracking-wider">{txt?.title ?? 'Dev Snake'}</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white flex items-center gap-1.5 transition-colors text-sm font-bold"
        >
          <Icon icon="solar:arrow-left-bold" /> {common?.exit ?? 'Exit'}
        </button>

        <div className="flex gap-1.5 items-center flex-wrap justify-end">
          <div className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg border border-purple-500/30 whitespace-nowrap">
            {common?.level ?? 'Lv'} {level}
          </div>
          <div className="text-white font-mono text-xs bg-black/30 px-2 py-1 rounded-lg border border-white/5 whitespace-nowrap">
            {common?.score ?? 'Score'}: <span className="text-primary font-bold">{score}</span>
          </div>
          <div className={`font-mono text-xs px-2 py-1 rounded-lg border transition-all whitespace-nowrap ${
            isNewRecord
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 animate-pulse'
              : 'bg-black/30 border-white/5 text-white'
          }`}>
            {common?.record ?? 'Rec'}: <span className="font-bold">{highScore}</span>
          </div>
          <button
            onPointerDown={() => togglePause()}
            className="text-white hover:text-primary transition-colors p-1.5 rounded-lg bg-black/20 border border-white/10"
            disabled={!started || gameOver}
          >
            <Icon icon={isPaused ? 'solar:play-bold' : 'solar:pause-bold'} width="18" />
          </button>
        </div>
      </div>

      {/* ── Board ── */}
      <div className="relative aspect-square bg-black/40 rounded-xl border border-white/20 overflow-hidden mx-auto w-full max-w-[320px] sm:max-w-[380px] shadow-inner">
        <div className="relative w-full h-full">
          {snake.map((seg, i) => {
            const isHead = i === 0;
            return (
              <div
                key={`s${seg.x}-${seg.y}-${i}`}
                className={`absolute transition-none ${
                  isHead ? 'bg-primary rounded-sm z-10' : 'bg-green-500/60 rounded-sm'
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

          {/* Food */}
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

        {/* Start screen */}
        {!started && !gameOver && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-3 p-4">
            <Icon icon="solar:gamepad-bold" className="text-primary text-5xl" />
            <h3 className="text-xl font-bold text-white">{txt?.title ?? 'Dev Snake'}</h3>
            <button
              onPointerDown={startGame}
              className="bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
            >
              <Icon icon="solar:play-bold" /> {txt?.start ?? 'Start'}
            </button>
            <p className="text-gray-400 text-xs text-center">
              {isMobile ? (txt?.helpMobile ?? 'Use D-pad to move') : (txt?.help ?? 'Use arrows to move')}
            </p>
          </div>
        )}

        {/* Paused */}
        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-3">
            <Icon icon="solar:pause-circle-bold" className="text-white text-6xl opacity-80" />
            <p className="text-gray-300 text-sm font-medium">
              {isMobile ? (txt?.pauseHintMobile ?? 'Tap ⏸ to continue') : (txt?.pauseHint ?? 'Press Space to continue')}
            </p>
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-in fade-in duration-300 gap-2 p-4">
            <h3 className="text-3xl font-bold text-red-500">{common?.gameOver ?? 'Game Over'}</h3>
            {isNewRecord && (
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest animate-bounce">
                {txt?.newRecord ?? '🏆 New Record!'}
              </span>
            )}
            <p className="text-gray-300 font-mono">
              {common?.score ?? 'Score'}: <span className="text-white font-bold text-xl">{score}</span>
            </p>
            <p className="text-gray-500 text-xs font-mono">
              {common?.level ?? 'Level'} {level} {txt?.levelReached ?? 'reached'}
            </p>
            <button
              onPointerDown={startGame}
              className="mt-2 bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(255,209,0,0.3)]"
            >
              <Icon icon="solar:restart-bold" /> {common?.tryAgain ?? 'Try Again'}
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile D-pad ── */}
      {isMobile && <div className="mt-5 grid w-[156px] grid-cols-3 gap-2 mx-auto">
        <div />
        <button
          onPointerDown={(e) => { e.preventDefault(); mobileDir('UP'); }}
          className="bg-white/10 p-3 rounded-2xl active:bg-primary active:text-bg transition-colors flex items-center justify-center border border-white/10"
        >
          <Icon icon="solar:arrow-up-bold" className="text-white text-xl" />
        </button>
        <div />

        <button
          onPointerDown={(e) => { e.preventDefault(); mobileDir('LEFT'); }}
          className="bg-white/10 p-3 rounded-2xl active:bg-primary active:text-bg transition-colors flex items-center justify-center border border-white/10"
        >
          <Icon icon="solar:arrow-left-bold" className="text-white text-xl" />
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); togglePause(); }}
          className="bg-white/5 p-3 rounded-2xl active:bg-white/20 transition-colors flex items-center justify-center border border-white/10"
        >
          <Icon icon={isPaused ? 'solar:play-bold' : 'solar:pause-bold'} className="text-white/60 text-lg" />
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); mobileDir('RIGHT'); }}
          className="bg-white/10 p-3 rounded-2xl active:bg-primary active:text-bg transition-colors flex items-center justify-center border border-white/10"
        >
          <Icon icon="solar:arrow-right-bold" className="text-white text-xl" />
        </button>

        <div />
        <button
          onPointerDown={(e) => { e.preventDefault(); mobileDir('DOWN'); }}
          className="bg-white/10 p-3 rounded-2xl active:bg-primary active:text-bg transition-colors flex items-center justify-center border border-white/10"
        >
          <Icon icon="solar:arrow-down-bold" className="text-white text-xl" />
        </button>
        <div />
      </div>}

      {/* ── Legend ── */}
      <p className="text-center text-xs text-gray-600 mt-3 font-mono flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_6px_#fde047]" />
          {txt?.goldenFood ?? 'Golden = 30 pts'}
        </span>
        <span className="text-gray-700">|</span>
        <span>{isMobile
          ? (txt?.controlsMobile ?? 'D-pad to move')
          : (txt?.controls ?? 'WASD / Arrows · Space = pause')}
        </span>
      </p>
    </div>
  );
}
