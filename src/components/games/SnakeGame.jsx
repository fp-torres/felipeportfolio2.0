import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { BoardOverlay, NewRecord, Stat } from './GameUI';
import { RECORD_KEYS, parseCount, saveRecord, useStoredRecord } from './records';
import { fill } from './text';
import { useElementSize } from './useElementSize';
import { useGameKeys } from './useGameKeys';
import { useGameViewport } from './viewport';

const GRID = 20;
const BASE_SPEED = 150;
const MIN_SPEED = 65;
const GOLDEN_CHANCE = 0.18;
const SWIPE_DISTANCE = 24; // px of finger travel before a swipe turns the snake — taps and jitter never do
const MAX_BOARD = 560;
const ROW_SIDES = 96 + 152 + 2 * 24; // side panels + gaps in the row layout
const START_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
const START_FOOD = { x: 15, y: 10, golden: false };
const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
const STEP = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
const KEY_DIRECTIONS = {
  arrowup: 'UP',
  w: 'UP',
  arrowdown: 'DOWN',
  s: 'DOWN',
  arrowleft: 'LEFT',
  a: 'LEFT',
  arrowright: 'RIGHT',
  d: 'RIGHT',
};

const DPAD = [
  { dir: 'UP', label: 'up', icon: 'solar:alt-arrow-up-linear', cell: 'col-start-2 row-start-1' },
  { dir: 'LEFT', label: 'left', icon: 'solar:alt-arrow-left-linear', cell: 'col-start-1 row-start-2' },
  { dir: 'RIGHT', label: 'right', icon: 'solar:alt-arrow-right-linear', cell: 'col-start-3 row-start-2' },
  { dir: 'DOWN', label: 'down', icon: 'solar:alt-arrow-down-linear', cell: 'col-start-2 row-start-3' },
];

const levelFor = (score) => Math.floor(score / 50) + 1;
const speedFor = (score) => Math.max(MIN_SPEED, BASE_SPEED - (levelFor(score) - 1) * 10);

// A random free cell, or null when the snake fills the whole board.
function randomFood(snake) {
  const taken = new Set(snake.map(({ x, y }) => y * GRID + x));
  const free = [];
  for (let cell = 0; cell < GRID * GRID; cell += 1) if (!taken.has(cell)) free.push(cell);
  if (free.length === 0) return null;
  const cell = free[Math.floor(Math.random() * free.length)];
  return { x: cell % GRID, y: Math.floor(cell / GRID), golden: Math.random() < GOLDEN_CHANCE };
}

// Cells are positioned in % of the board with a 1px inset so segments read as separate blocks.
const cellStyle = ({ x, y }) => ({
  left: `calc(${(x * 100) / GRID}% + 1px)`,
  top: `calc(${(y * 100) / GRID}% + 1px)`,
  width: `calc(${100 / GRID}% - 2px)`,
  height: `calc(${100 / GRID}% - 2px)`,
});

export default function SnakeGame() {
  const { t } = useLanguage();
  const text = t.minigames.snake;
  const common = t.minigames.common;
  const viewport = useGameViewport();
  const { wide } = viewport;
  const best = parseCount(useStoredRecord(RECORD_KEYS.snake)) ?? 0;

  const [snake, setSnake] = useState(START_SNAKE);
  const [food, setFood] = useState(START_FOOD);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | playing | paused | over
  const [newRecord, setNewRecord] = useState(false);

  const game = useRef({ snake: START_SNAKE, food: START_FOOD, dir: 'RIGHT', queue: [], score: 0, best: 0 });
  const swipe = useRef(null);
  const [areaRef, area] = useElementSize();
  const [controlsRef, controls] = useElementSize();
  // Row: the board takes what the side panels leave. Column: board and controls share the measured area
  // as one centred group.
  const boardSize = Math.floor(
    wide
      ? Math.min(viewport.height, viewport.width - ROW_SIDES, MAX_BOARD)
      : Math.min(area.width, area.height - (controls.height > 0 ? controls.height + 16 : 0), MAX_BOARD),
  );
  const level = levelFor(score);

  // The loop only runs while playing: pausing, game over and closing the sheet (unmount) all stop it.
  useEffect(() => {
    if (status !== 'playing') return undefined;
    let timer = 0;

    const tick = () => {
      const current = game.current;
      if (current.queue.length > 0) current.dir = current.queue.shift();
      const [dx, dy] = STEP[current.dir];
      const head = { x: current.snake[0].x + dx, y: current.snake[0].y + dy };
      const ate = head.x === current.food.x && head.y === current.food.y;
      const body = ate ? current.snake : current.snake.slice(0, -1);
      const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID;

      if (hitWall || body.some((part) => part.x === head.x && part.y === head.y)) {
        setStatus('over');
        return;
      }

      current.snake = [head, ...body];
      if (ate) {
        current.score += current.food.golden ? 30 : 10;
        setScore(current.score);
        if (current.score > current.best) {
          saveRecord(RECORD_KEYS.snake, current.score);
          setNewRecord(true);
        }
        const next = randomFood(current.snake);
        if (!next) {
          // The snake fills the board: nothing left to eat.
          setSnake(current.snake);
          setStatus('over');
          return;
        }
        current.food = next;
        setFood(next);
      }
      setSnake(current.snake);
      timer = window.setTimeout(tick, speedFor(current.score));
    };

    timer = window.setTimeout(tick, speedFor(game.current.score));
    return () => window.clearTimeout(timer);
  }, [status]);

  // Switching tabs or apps pauses the game.
  useEffect(() => {
    if (status !== 'playing') return undefined;
    const pauseWhenHidden = () => {
      if (document.hidden) setStatus('paused');
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [status]);

  const start = () => {
    const firstFood = randomFood(START_SNAKE);
    game.current = { snake: START_SNAKE, food: firstFood, dir: 'RIGHT', queue: [], score: 0, best };
    setSnake(START_SNAKE);
    setFood(firstFood);
    setScore(0);
    setNewRecord(false);
    setStatus('playing');
  };

  const togglePause = () => {
    if (status === 'playing') setStatus('paused');
    else if (status === 'paused') setStatus('playing');
  };

  // Up to two queued turns, so quick swipes/keys between ticks are not lost (and never reverse the snake).
  const turn = (dir) => {
    if (status !== 'playing') return;
    const current = game.current;
    const last = current.queue[current.queue.length - 1] ?? current.dir;
    if (dir === last || dir === OPPOSITE[last] || current.queue.length >= 2) return;
    current.queue.push(dir);
  };

  useGameKeys((event) => {
    const dir = KEY_DIRECTIONS[event.key?.toLowerCase()];
    if (dir) {
      if (status !== 'playing') return false;
      turn(dir);
      return true;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      if (status === 'idle' || status === 'over') start();
      else togglePause();
      return true;
    }
    return false;
  });

  const onPointerDown = (event) => {
    if (status !== 'playing' || !event.isPrimary) return;
    swipe.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event) => {
    const from = swipe.current;
    if (!from || !event.isPrimary) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : dy > 0 ? 'DOWN' : 'UP');
    // Keep tracking from here: one continuous gesture can steer several times.
    swipe.current = { x: event.clientX, y: event.clientY };
  };

  const endSwipe = () => {
    swipe.current = null;
  };

  const playing = status === 'playing';
  // The board stays empty until the first start, so nothing shows through the start card. Paused and game-over
  // boards keep the (dimmed) snake in view.
  const started = status !== 'idle';

  const pauseButton = (
    <button
      type="button"
      onClick={togglePause}
      disabled={status === 'idle' || status === 'over'}
      aria-label={status === 'paused' ? common.resume : common.pause}
      className="icon-btn disabled:opacity-40"
    >
      {status === 'paused' ? (
        <Icon icon="solar:play-linear" aria-hidden="true" className="size-5" />
      ) : (
        <Icon icon="solar:pause-linear" aria-hidden="true" className="size-5" />
      )}
    </button>
  );

  // Touch screens: a D-pad as an alternative to swiping. pointerdown reacts instantly; keyboard clicks
  // (detail 0) also work. The pad never scrolls anything (touch-none).
  const dpad = (
    <div className="hidden touch-none select-none grid-cols-3 grid-rows-3 gap-1 touch:grid">
      {DPAD.map(({ dir, label, icon, cell }) => (
        <button
          key={dir}
          type="button"
          aria-label={text.directions[label]}
          disabled={!playing}
          onPointerDown={(event) => {
            event.preventDefault();
            turn(dir);
          }}
          onClick={(event) => {
            if (event.detail === 0) turn(dir);
          }}
          className={`${cell} grid size-12 place-items-center rounded-control bg-white/10 text-label-1 transition-colors duration-fast active:bg-white/25 disabled:opacity-40`}
        >
          <Icon icon={icon} aria-hidden="true" className="size-6" />
        </button>
      ))}
    </div>
  );

  const legend = (
    <div className="space-y-1 text-footnote text-label-2 touch:hidden">
      {/* mt-1 centres the dot on the first line (18px) when the text wraps in the narrow side column. */}
      <p className="flex items-start gap-2">
        <span aria-hidden="true" className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
        {text.golden}
      </p>
      <p>{text.helpKeys}</p>
    </div>
  );

  const board = boardSize > 0 && (
    <div
      role="group"
      aria-label={text.board}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
      className="relative touch-none select-none overflow-hidden rounded-tile bg-bg ring-1 ring-white/10 [-webkit-touch-callout:none]"
      style={{ width: boardSize, height: boardSize }}
    >
      {started &&
        snake.map((part, index) => (
          <div
            key={index === 0 ? 'head' : `${part.x}-${part.y}`}
            aria-hidden="true"
            className={`absolute rounded-[3px] ${index === 0 ? 'bg-label-1' : 'bg-success/80'}`}
            style={cellStyle(part)}
          />
        ))}
      {started && (
        <div
          aria-hidden="true"
          className={`absolute rounded-full ${food.golden ? 'bg-primary' : 'bg-danger'}`}
          style={cellStyle(food)}
        />
      )}

      {status === 'idle' && (
        <BoardOverlay>
          <p className="max-w-[16rem] text-callout text-label-2">
            <span className="touch:hidden">{text.helpKeys}</span>
            <span className="hidden touch:inline">{text.helpTouch}</span>
          </p>
          {/* The dot sits in the text flow: when the hint wraps it stays on the first line, and the lines stay
              centred like the help above. */}
          <p className="max-w-[16rem] text-balance text-footnote text-label-2">
            <span aria-hidden="true" className="mr-1.5 inline-block size-2.5 rounded-full bg-primary align-middle" />
            {text.golden}
          </p>
          <button type="button" onClick={start} className="btn-primary">
            <Icon icon="solar:play-linear" aria-hidden="true" className="size-5" />
            {common.start}
          </button>
        </BoardOverlay>
      )}

      {status === 'paused' && (
        <BoardOverlay>
          <p className="text-title-3 text-label-1">{common.paused}</p>
          <button type="button" onClick={togglePause} className="btn-primary">
            <Icon icon="solar:play-linear" aria-hidden="true" className="size-5" />
            {common.resume}
          </button>
        </BoardOverlay>
      )}

      {status === 'over' && (
        <BoardOverlay>
          <p className="text-title-2 text-label-1">{common.gameOver}</p>
          <p className="text-callout tabular-nums text-label-2">
            {common.score}: {score} · {fill(text.levelReached, { n: level })}
          </p>
          {newRecord && <NewRecord label={common.newRecord} />}
          <button type="button" onClick={start} className="btn-primary mt-1">
            <Icon icon="solar:restart-linear" aria-hidden="true" className="size-5" />
            {common.playAgain}
          </button>
        </BoardOverlay>
      )}
    </div>
  );

  if (wide) {
    return (
      <div className="flex h-full items-center justify-center gap-6">
        <div className="flex w-24 shrink-0 flex-col gap-4">
          <Stat label={common.score} value={score} />
          <Stat label={common.level} value={level} />
          {pauseButton}
        </div>
        {board}
        <div className="flex w-[9.5rem] shrink-0 flex-col items-center">
          {dpad}
          {legend}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-xl flex-col gap-3">
      <div className="flex shrink-0 items-center gap-6">
        <Stat label={common.score} value={score} />
        <Stat label={common.level} value={level} />
        <div className="ml-auto">{pauseButton}</div>
      </div>
      <div ref={areaRef} className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-4">
        {board}
        <div ref={controlsRef} className="flex shrink-0 justify-center">
          {dpad}
          {legend}
        </div>
      </div>
    </div>
  );
}
