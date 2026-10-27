import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m as Motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { EASE } from '../../lib/motion';
import { Lives, NewRecord, Stat } from './GameUI';
import { moveGridFocus } from './gridKeys';
import { RECORD_KEYS, parseCount, saveRecord, useStoredRecord } from './records';
import { fill, plural } from './text';
import { useElementSize } from './useElementSize';
import { useGameViewport } from './viewport';

const BASE_LEVELS = [
  { size: 3, tiles: 3 },
  { size: 3, tiles: 4 },
  { size: 4, tiles: 5 },
  { size: 4, tiles: 6 },
  { size: 5, tiles: 7 },
  { size: 5, tiles: 8 },
  { size: 6, tiles: 9 },
];
const MIN_TILE = 44; // tiles never get smaller than a touch target, so the grid stops growing on small screens
const GAP = 6;
const BOARD_PADDING = 8;
const STATUS_HEIGHT = 48;
const MAX_BOARD = 520;
const ROW_SIDE = 224 + 32; // side panel + gap in the row layout

// The grid grows with the level, capped by what fits the screen; past the cap the level adds tiles.
function levelFor(index, maxSize) {
  let base = BASE_LEVELS[index];
  if (!base) {
    const extra = index - BASE_LEVELS.length + 1;
    base = { size: Math.min(7 + Math.floor(extra / 2), 10), tiles: 9 + extra };
  }
  const size = Math.min(base.size, maxSize);
  return { size, tiles: Math.min(base.tiles, Math.floor(size * size * 0.6)) };
}

function createRound({ size, tiles }) {
  const total = size * size;
  const pattern = new Set();
  while (pattern.size < tiles) pattern.add(Math.floor(Math.random() * total));
  const free = Array.from({ length: total }, (_, index) => index).filter((index) => !pattern.has(index));
  const golden = free.length > 0 ? free[Math.floor(Math.random() * free.length)] : null;
  return { size, pattern: [...pattern], golden };
}

export default function MatrixRecall() {
  const { t } = useLanguage();
  const text = t.minigames.matrix;
  const common = t.minigames.common;
  const viewport = useGameViewport();
  const { wide } = viewport;
  const best = parseCount(useStoredRecord(RECORD_KEYS.matrix)) ?? 0;

  const [levelIndex, setLevelIndex] = useState(0);
  const [round, setRound] = useState({ size: 3, pattern: [], golden: null });
  const [selected, setSelected] = useState([]);
  const [goldenUsed, setGoldenUsed] = useState(false);
  const [lifeGained, setLifeGained] = useState(false); // the golden tile only helps when a life was lost
  const [status, setStatus] = useState('idle'); // idle | preview | countdown | playing | won | error | lost
  const [countdown, setCountdown] = useState(3);
  const [lives, setLives] = useState(3);
  const [newRecord, setNewRecord] = useState(false);
  const timerRef = useRef(0);
  const maxSizeRef = useRef(3);
  const [areaRef, area] = useElementSize();

  const boardSize = Math.floor(
    wide
      ? Math.min(viewport.height, viewport.width - ROW_SIDE, MAX_BOARD)
      : Math.min(area.width, area.height - STATUS_HEIGHT - 12, MAX_BOARD),
  );
  const maxSize = Math.min(10, Math.max(3, Math.floor((boardSize - 2 * BOARD_PADDING + GAP) / (MIN_TILE + GAP))));

  useEffect(() => {
    maxSizeRef.current = maxSize;
  }, [maxSize]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (status !== 'countdown') return undefined;
    const id = window.setTimeout(() => {
      if (countdown <= 1) setStatus('playing');
      else setCountdown(countdown - 1);
    }, 600);
    return () => window.clearTimeout(id);
  }, [status, countdown]);

  const startLevel = (index) => {
    window.clearTimeout(timerRef.current);
    const level = levelFor(index, maxSizeRef.current);
    setRound(createRound(level));
    setSelected([]);
    setGoldenUsed(false);
    setLifeGained(false);
    setLevelIndex(index);
    setStatus('preview');
    const previewMs = Math.max(900, 1000 + level.tiles * 200 - Math.max(0, index - BASE_LEVELS.length) * 80);
    timerRef.current = window.setTimeout(() => {
      setCountdown(3);
      setStatus('countdown');
    }, previewMs);
  };

  const begin = () => {
    setLives(3);
    setNewRecord(false);
    startLevel(0);
  };

  const pick = (index) => {
    if (status !== 'playing' || selected.includes(index)) return;
    const nextSelected = [...selected, index];
    setSelected(nextSelected);

    if (index === round.golden && !goldenUsed) {
      setGoldenUsed(true);
      if (lives < 3) {
        setLives(lives + 1);
        setLifeGained(true);
      }
      return;
    }

    if (round.pattern.includes(index)) {
      const found = nextSelected.filter((item) => round.pattern.includes(item)).length;
      if (found < round.pattern.length) return;
      setStatus('won');
      const reached = levelIndex + 1;
      if (reached > best) {
        saveRecord(RECORD_KEYS.matrix, reached);
        setNewRecord(true);
      }
      timerRef.current = window.setTimeout(() => startLevel(levelIndex + 1), 900);
      return;
    }

    setStatus('error');
    const remaining = lives - 1;
    setLives(remaining);
    timerRef.current = window.setTimeout(() => {
      if (remaining <= 0) setStatus('lost');
      else startLevel(levelIndex);
    }, 900);
  };

  const tileClass = (index) => {
    const inPattern = round.pattern.includes(index);
    const isSelected = selected.includes(index);
    const isGolden = index === round.golden;

    if (status === 'preview') {
      if (inPattern) return 'bg-label-1';
      if (isGolden) return 'bg-primary';
    }
    if (status === 'playing' || status === 'won' || status === 'error') {
      if (isSelected && isGolden) return 'bg-primary';
      if (isSelected) return inPattern ? 'bg-success' : 'bg-danger';
      if (isGolden && !goldenUsed) return 'bg-primary/20 ring-1 ring-inset ring-primary/60';
    }
    return 'bg-white/[0.08]';
  };

  const tileIcon = (index) => {
    const isGolden = index === round.golden;
    const isSelected = selected.includes(index);
    if (isGolden && (status === 'preview' || (!goldenUsed && status !== 'countdown') || isSelected)) {
      return (
        <Icon
          icon="solar:star-bold"
          aria-hidden="true"
          className={`size-[45%] ${status === 'preview' || isSelected ? 'text-bg' : 'text-primary'}`}
        />
      );
    }
    if (!isSelected || round.size > 5 || status === 'preview') return null;
    return round.pattern.includes(index) ? (
      <Icon icon="solar:check-circle-linear" aria-hidden="true" className="size-[45%] text-bg" />
    ) : (
      <Icon icon="solar:close-circle-linear" aria-hidden="true" className="size-[45%] text-white" />
    );
  };

  const statusLine = (() => {
    if (status === 'preview') return <p className="text-callout font-semibold text-label-1">{text.memorize}</p>;
    if (status === 'countdown') return <p className="text-callout text-label-2">{text.ready}</p>;
    if (status === 'won') {
      return (
        <p className="inline-flex items-center gap-2 text-callout font-semibold text-success">
          <Icon icon="solar:check-circle-linear" aria-hidden="true" className="size-5" />
          {text.success}
        </p>
      );
    }
    if (status === 'error') {
      return (
        <p className="inline-flex items-center gap-2 text-callout font-semibold text-danger">
          <Icon icon="solar:close-circle-linear" aria-hidden="true" className="size-5" />
          {text.wrong}
        </p>
      );
    }
    if (status === 'playing') {
      return (
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-callout text-label-1">
          {text.repeat}
          {round.golden !== null && !goldenUsed && (
            <span className="inline-flex items-center gap-1 text-footnote text-label-2">
              <Icon icon="solar:star-bold" aria-hidden="true" className="size-4 text-primary" />
              {text.goldenHint}
            </span>
          )}
          {lifeGained && <span className="text-footnote font-semibold text-success">{text.goldenUsed}</span>}
        </p>
      );
    }
    return null;
  })();

  const screen = (() => {
    if (status === 'idle') {
      return (
        <div className="flex max-w-xs flex-col items-center gap-4 text-center">
          <p className="text-callout text-label-2">{text.intro}</p>
          <p className="chip">
            <Icon icon="solar:star-bold" aria-hidden="true" className="size-4 text-primary" />
            {text.goldenHint}
          </p>
          <button type="button" onClick={begin} className="btn-primary">
            <Icon icon="solar:play-linear" aria-hidden="true" className="size-5" />
            {common.start}
          </button>
        </div>
      );
    }
    if (status === 'lost') {
      return (
        <div className="flex max-w-xs flex-col items-center gap-3 text-center">
          <Icon icon="solar:sad-circle-linear" aria-hidden="true" className="size-10 text-label-2" />
          <p className="text-title-2 text-label-1">{text.fail}</p>
          <p className="text-callout text-label-2">{plural(text.reached, levelIndex)}</p>
          {newRecord && <NewRecord label={common.newRecord} />}
          <button type="button" onClick={begin} className="btn-primary mt-1">
            <Icon icon="solar:restart-linear" aria-hidden="true" className="size-5" />
            {common.tryAgain}
          </button>
        </div>
      );
    }
    if (boardSize <= 0) return null;
    return (
      <div
        className="relative shrink-0 touch-none select-none rounded-tile bg-bg ring-1 ring-white/10 [-webkit-touch-callout:none]"
        style={{ width: boardSize, height: boardSize, padding: BOARD_PADDING }}
      >
        <div
          role="group"
          aria-label={text.board}
          onKeyDown={(event) => moveGridFocus(event, round.size)}
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${round.size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${round.size}, minmax(0, 1fr))`,
            gap: GAP,
          }}
        >
          {Array.from({ length: round.size * round.size }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={fill(text.tile, { n: index + 1 })}
              disabled={status !== 'playing'}
              onClick={() => pick(index)}
              className={`grid place-items-center rounded-[8px] transition-[background-color,transform] duration-fast ease-standard enabled:active:scale-95 ${tileClass(index)}`}
            >
              {tileIcon(index)}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {status === 'countdown' && (
            <Motion.div
              key={countdown}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE.emphasized }}
              className="pointer-events-none absolute inset-0 grid place-items-center rounded-[inherit] bg-bg/60"
            >
              <span className="text-stat tabular-nums text-label-1">{countdown}</span>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  })();

  const showStatus = status !== 'idle' && status !== 'lost';
  const stats = (
    <>
      <Stat label={common.level} value={status === 'idle' ? '–' : levelIndex + 1} />
      <Lives count={lives} label={fill(common.livesLabel, { n: lives })} />
    </>
  );

  if (wide) {
    return (
      <div className="flex h-full items-center justify-center gap-8">
        <div className="grid shrink-0 place-items-center" style={{ width: boardSize, height: boardSize }}>
          {screen}
        </div>
        <div className="flex w-56 shrink-0 flex-col gap-5">
          <div className="flex items-center justify-between gap-4">{stats}</div>
          <div aria-live="polite" className="min-h-12 text-left">
            {showStatus && statusLine}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-xl flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-4">{stats}</div>
      <div ref={areaRef} className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        {screen}
        {showStatus && (
          <div
            aria-live="polite"
            className="flex w-full shrink-0 items-center justify-center text-center"
            style={{ height: STATUS_HEIGHT }}
          >
            {statusLine}
          </div>
        )}
      </div>
    </div>
  );
}
