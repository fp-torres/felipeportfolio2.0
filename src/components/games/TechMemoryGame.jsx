import { useEffect, useRef, useState } from 'react';
import { m as Motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { EASE } from '../../lib/motion';
import { NewRecord, ResultOverlay, Stat } from './GameUI';
import { moveGridFocus } from './gridKeys';
import { RECORD_KEYS, parseMemoryRecords, saveRecord, useStoredRecord } from './records';
import { fill, formatClock } from './text';
import { useElementSize } from './useElementSize';

// Colour logos on light card faces. Linux uses the Tux from the "logos" set: devicon's Linux logo is a
// 191 KB SVG and every icon ends up in the main bundle.
const TECHS = [
  { id: 'react', icon: 'devicon:react', name: 'React' },
  { id: 'python', icon: 'devicon:python', name: 'Python' },
  { id: 'javascript', icon: 'devicon:javascript', name: 'JavaScript' },
  { id: 'typescript', icon: 'devicon:typescript', name: 'TypeScript' },
  { id: 'linux', icon: 'logos:linux-tux', name: 'Linux' },
  { id: 'docker', icon: 'devicon:docker', name: 'Docker' },
  { id: 'mysql', icon: 'devicon:mysql', name: 'MySQL' },
  { id: 'git', icon: 'devicon:git', name: 'Git' },
  { id: 'node', icon: 'devicon:nodejs', name: 'Node.js' },
  { id: 'php', icon: 'devicon:php', name: 'PHP' },
  { id: 'java', icon: 'devicon:java', name: 'Java' },
  { id: 'html', icon: 'devicon:html5', name: 'HTML' },
];

const MODES = [
  { id: 'easy', pairs: 6 },
  { id: 'medium', pairs: 8 },
  { id: 'hard', pairs: 12 },
];

const GAP = 8;
const MAX_CARD = 112;
const MIN_CARD_WITH_NAME = 76;

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createDeck(pairs) {
  const techs = shuffle(TECHS).slice(0, pairs);
  return shuffle([...techs, ...techs]).map((tech, index) => ({ ...tech, uid: `${tech.id}-${index}` }));
}

// Even grid (no half-empty row) with the biggest cards that fit the measured area: 4×4 on a phone,
// 8×2 on a landscape phone, 6×4 on desktop…
function layoutGrid(count, width, height) {
  let best = { columns: 4, size: 0 };
  for (let columns = 2; columns <= 8; columns += 1) {
    if (count % columns !== 0) continue;
    const rows = count / columns;
    const size = Math.floor(Math.min((width - GAP * (columns - 1)) / columns, (height - GAP * (rows - 1)) / rows));
    if (size > best.size) best = { columns, size };
  }
  return { columns: best.columns, size: Math.min(best.size, MAX_CARD) };
}

export default function TechMemoryGame() {
  const { t } = useLanguage();
  const text = t.minigames.memory;
  const common = t.minigames.common;
  const records = parseMemoryRecords(useStoredRecord(RECORD_KEYS.memory));

  const [mode, setMode] = useState(null); // null → choosing the difficulty
  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState([]); // face-up cards not matched yet (at most two)
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false); // the clock runs from the first flip to the last pair
  const [won, setWon] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const timerRef = useRef(0);
  const [areaRef, area] = useElementSize();

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const start = (nextMode) => {
    window.clearTimeout(timerRef.current);
    const { pairs } = MODES.find((item) => item.id === nextMode);
    setMode(nextMode);
    setDeck(createDeck(pairs));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setWon(false);
    setNewRecord(false);
  };

  const chooseMode = () => {
    window.clearTimeout(timerRef.current);
    setRunning(false);
    setWon(false);
    setMode(null);
  };

  const finish = (finalMoves) => {
    const best = records[mode];
    if (best === null || finalMoves < best) {
      const next = Object.fromEntries(
        Object.entries({ ...records, [mode]: finalMoves }).filter(([, value]) => value !== null),
      );
      saveRecord(RECORD_KEYS.memory, JSON.stringify(next));
      setNewRecord(true);
    }
    setWon(true);
  };

  // Cards are buttons: a tap only counts when the finger didn't move (scrolling never flips a card) and
  // the keyboard works too (Tab / arrows + Enter or Space).
  const flip = (card) => {
    if (won || flipped.length === 2 || flipped.includes(card.uid) || matched.includes(card.uid)) return;
    if (!running && moves === 0 && matched.length === 0) setRunning(true);
    if (flipped.length === 0) {
      setFlipped([card.uid]);
      return;
    }

    const first = deck.find((item) => item.uid === flipped[0]);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (first.id === card.id) {
      const nextMatched = [...matched, first.uid, card.uid];
      setMatched(nextMatched);
      setFlipped([]);
      if (nextMatched.length === deck.length) {
        setRunning(false);
        timerRef.current = window.setTimeout(() => finish(nextMoves), 500);
      }
    } else {
      setFlipped([first.uid, card.uid]);
      timerRef.current = window.setTimeout(() => setFlipped([]), 900);
    }
  };

  const { columns, size } = layoutGrid(deck.length, area.width, area.height);

  return (
    <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col gap-3">
      {mode && (
        <div className="flex shrink-0 items-center gap-6">
          <Stat label={text.moves} value={moves} />
          <Stat label={common.time} value={formatClock(seconds)} />
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => start(mode)} aria-label={common.restart} className="icon-btn">
              <Icon icon="solar:restart-linear" aria-hidden="true" className="size-5" />
            </button>
            <button type="button" onClick={chooseMode} aria-label={text.changeMode} className="icon-btn">
              <Icon icon="solar:hamburger-menu-linear" aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div ref={areaRef} className="grid min-h-0 flex-1 place-items-center">
        {!mode && (
          <div className="w-full max-w-sm">
            <h3 className="text-title-3 text-label-1">{text.chooseMode}</h3>
            <ul className="mt-3 divide-y divide-separator/10 overflow-hidden rounded-tile bg-surface-2">
              {MODES.map(({ id, pairs }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => start(id)}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-fast hover:bg-surface-3 active:bg-surface-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-callout font-semibold text-label-1">{text.modes[id]}</span>
                      <span className="block text-footnote text-label-2">{fill(text.pairs, { n: pairs })}</span>
                    </span>
                    <span className="shrink-0 text-footnote tabular-nums text-label-2">
                      {records[id] ? fill(text.best, { n: records[id] }) : text.noBest}
                    </span>
                    <Icon icon="solar:alt-arrow-right-linear" aria-hidden="true" className="size-5 shrink-0 text-label-2" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode && size > 0 && (
          <div
            role="group"
            aria-label={text.board}
            onKeyDown={(event) => moveGridFocus(event, columns)}
            className="grid touch-none select-none [-webkit-touch-callout:none]"
            style={{ gridTemplateColumns: `repeat(${columns}, ${size}px)`, gap: GAP }}
          >
            {deck.map((card) => {
              const isMatched = matched.includes(card.uid);
              const faceUp = isMatched || flipped.includes(card.uid);
              const label = !faceUp ? text.hiddenCard : isMatched ? fill(text.matched, { name: card.name }) : card.name;

              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => flip(card)}
                  disabled={isMatched}
                  aria-label={label}
                  className="relative rounded-control [perspective:800px]"
                  style={{ width: size, height: size }}
                >
                  <Motion.span
                    initial={false}
                    animate={{ rotateY: faceUp ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: EASE.standard }}
                    className="absolute inset-0 block [transform-style:preserve-3d]"
                  >
                    <span className="absolute inset-0 grid place-items-center rounded-control bg-surface-2 transition-colors duration-fast [backface-visibility:hidden] hover:bg-surface-3">
                      <Icon icon="solar:code-square-linear" aria-hidden="true" className="size-[36%] text-white/25" />
                    </span>
                    <span
                      className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-control bg-label-1 transition-opacity duration-base [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                        isMatched ? 'opacity-50' : ''
                      }`}
                    >
                      <Icon icon={card.icon} aria-hidden="true" className="size-[46%]" />
                      {size >= MIN_CARD_WITH_NAME && (
                        <span className="text-caption font-medium text-bg/70">{card.name}</span>
                      )}
                    </span>
                  </Motion.span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {won && (
        <ResultOverlay>
          <p className="text-title-2 text-label-1">{text.winTitle}</p>
          <p className="text-callout tabular-nums text-label-2">
            {fill(text.winText, { moves, time: formatClock(seconds) })} · {text.modes[mode]}
          </p>
          {newRecord && <NewRecord label={common.newRecord} />}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => start(mode)} className="btn-primary">
              {common.playAgain}
            </button>
            <button type="button" onClick={chooseMode} className="btn-secondary">
              {text.changeMode}
            </button>
          </div>
        </ResultOverlay>
      )}
    </div>
  );
}
