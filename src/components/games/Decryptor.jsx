import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { NewRecord, ResultOverlay, Stat } from './GameUI';
import { RECORD_KEYS, parseCount, saveRecord, useStoredRecord } from './records';
import { fill, plural } from './text';
import { useElementSize } from './useElementSize';
import { useGameKeys } from './useGameKeys';
import { useGameViewport } from './viewport';

// Game pieces: ten glyphs, each with its own colour token (the shape alone also tells them apart).
const SYMBOLS = [
  { id: 'A', icon: 'solar:code-circle-linear', color: 'text-success' },
  { id: 'B', icon: 'solar:shield-warning-linear', color: 'text-danger' },
  { id: 'C', icon: 'solar:cpu-bolt-linear', color: 'text-data-1' },
  { id: 'D', icon: 'solar:wi-fi-router-linear', color: 'text-primary' },
  { id: 'E', icon: 'solar:database-linear', color: 'text-data-4' },
  { id: 'F', icon: 'solar:lock-password-linear', color: 'text-label-1' },
  { id: 'G', icon: 'solar:bug-linear', color: 'text-data-6' },
  { id: 'H', icon: 'solar:server-linear', color: 'text-info' },
  { id: 'I', icon: 'solar:key-linear', color: 'text-label-2' },
  { id: 'J', icon: 'solar:fire-linear', color: 'text-warning' },
];
const SYMBOL_BY_ID = Object.fromEntries(SYMBOLS.map((symbol) => [symbol.id, symbol]));

const MIN_KEY = 44; // every key stays a full touch target
const KEY_GAP = 8;
const MAX_KEYS_PER_ROW = 6;

function configFor(level) {
  const table = [
    null,
    { slots: 3, options: 4, tries: 8 },
    { slots: 4, options: 5, tries: 10 },
    { slots: 4, options: 6, tries: 10 },
    { slots: 5, options: 6, tries: 12 },
    { slots: 5, options: 7, tries: 11 },
    { slots: 5, options: 8, tries: 10 },
    { slots: 6, options: 8, tries: 12 },
    { slots: 6, options: 9, tries: 11 },
    { slots: 6, options: 9, tries: 10 },
  ];
  return table[level] ?? { slots: 6, options: 10, tries: Math.max(7, 10 - Math.floor((level - 10) / 2)) };
}

function createCode(level) {
  const { slots, options } = configFor(level);
  return Array.from({ length: slots }, () => SYMBOLS[Math.floor(Math.random() * options)].id);
}

function score(guess, code) {
  let exact = 0;
  const restCode = [];
  const restGuess = [];
  guess.forEach((id, index) => {
    if (id === code[index]) exact += 1;
    else {
      restCode.push(code[index]);
      restGuess.push(id);
    }
  });
  let partial = 0;
  restGuess.forEach((id) => {
    const found = restCode.indexOf(id);
    if (found !== -1) {
      partial += 1;
      restCode.splice(found, 1);
    }
  });
  return { exact, partial };
}

// Balanced rows of keys that are never narrower than MIN_KEY in the measured keyboard width.
function keyColumns(options, width) {
  const fit = width > 0 ? Math.floor((width + KEY_GAP) / (MIN_KEY + KEY_GAP)) : 5;
  const perRow = Math.max(1, Math.min(MAX_KEYS_PER_ROW, fit, options));
  return Math.ceil(options / Math.ceil(options / perRow));
}

function SymbolChip({ id, className = 'size-7' }) {
  const symbol = SYMBOL_BY_ID[id];
  return (
    <span className={`grid place-items-center rounded-[8px] bg-white/[0.06] ${className}`}>
      <Icon icon={symbol.icon} aria-hidden="true" className={`size-[64%] ${symbol.color}`} />
    </span>
  );
}

export default function Decryptor() {
  const { t } = useLanguage();
  const text = t.minigames.decryptor;
  const common = t.minigames.common;
  const { wide, short } = useGameViewport();
  const landscape = wide && short; // landscape phones: history on the left, keyboard on the right
  const stored = parseCount(useStoredRecord(RECORD_KEYS.decryptor)) ?? 1; // next level to unlock

  const [level, setLevel] = useState(1);
  const [code, setCode] = useState(() => createCode(1));
  const [rows, setRows] = useState([]); // { kind: 'guess', symbols, exact, partial } | { kind: 'hint', index, symbol }
  const [current, setCurrent] = useState([]);
  const [status, setStatus] = useState('playing'); // playing | won | lost
  const [newRecord, setNewRecord] = useState(false);
  const historyRef = useRef(null);
  const [keysRef, keysBox] = useElementSize();

  const config = configFor(level);
  const options = SYMBOLS.slice(0, config.options);
  const used = rows.length; // a hint costs one attempt, like a guess
  const left = config.tries - used;
  const full = current.length === config.slots;
  const playing = status === 'playing';
  const columns = keyColumns(config.options, keysBox.width);
  const keyRows = Math.ceil(config.options / columns);

  // Positions not confirmed yet (never exact in a guess and not revealed by a hint).
  const unknown = code
    .map((id, index) => index)
    .filter(
      (index) =>
        !rows.some((row) =>
          row.kind === 'hint' ? row.index === index : row.symbols[index] === code[index],
        ),
    );
  const hintUsed = rows.some((row) => row.kind === 'hint');
  const canHint = playing && !hintUsed && left > 1 && unknown.length > 0;

  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, [rows.length]);

  const startLevel = (next) => {
    setLevel(next);
    setCode(createCode(next));
    setRows([]);
    setCurrent([]);
    setNewRecord(false);
    setStatus('playing');
  };

  const add = (id) => {
    if (playing && !full) setCurrent((previous) => [...previous, id]);
  };

  const erase = () => {
    if (playing) setCurrent((previous) => previous.slice(0, -1));
  };

  const hint = () => {
    if (!canHint) return;
    const index = unknown[0];
    setRows((previous) => [...previous, { kind: 'hint', index, symbol: code[index] }]);
  };

  const submit = () => {
    if (!playing || !full) return;
    const result = score(current, code);
    const nextRows = [...rows, { kind: 'guess', symbols: current, ...result }];
    setRows(nextRows);
    setCurrent([]);
    if (result.exact === config.slots) {
      setStatus('won');
      if (level + 1 > stored) {
        saveRecord(RECORD_KEYS.decryptor, level + 1);
        setNewRecord(true);
      }
    } else if (nextRows.length >= config.tries) {
      setStatus('lost');
    }
  };

  // Physical keyboard, only while this game is open: 1–9/0 pick symbols, Backspace deletes, Enter submits.
  useGameKeys((event) => {
    if (!playing) return false;
    if (/^[0-9]$/.test(event.key)) {
      const index = event.key === '0' ? 9 : Number(event.key) - 1;
      if (index >= options.length) return false;
      add(options[index].id);
      return true;
    }
    if (event.key === 'Backspace') {
      erase();
      return true;
    }
    if (event.key === 'Enter') {
      submit();
      return true;
    }
    return false;
  });

  const stats = (
    <div className="flex shrink-0 items-center gap-5">
      <Stat label={common.level} value={level} />
      <Stat label={text.attempts} value={`${used}/${config.tries}`} />
      <button
        type="button"
        onClick={hint}
        disabled={!canHint}
        aria-label={hintUsed ? text.hintUsed : undefined}
        className="btn-secondary ml-auto shrink-0 px-4"
      >
        <Icon icon="solar:eye-linear" aria-hidden="true" className="size-5" />
        {text.hint}
      </button>
    </div>
  );

  const legend = (
    <p className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-footnote text-label-2">
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-success" />
        {text.exactMatch}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-warning" />
        {text.partialMatch}
      </span>
    </p>
  );

  // Chips shrink (never overflow) when six of them meet a narrow column.
  const chipColumns = { gridTemplateColumns: `repeat(${config.slots}, minmax(0, 1.75rem))` };

  const history = (
    <ol
      ref={historyRef}
      className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain rounded-tile bg-bg p-2 ring-1 ring-white/10"
    >
      {rows.length === 0 && (
        <li className="grid h-full place-items-center px-4 text-center text-footnote text-label-2">{text.placeholder}</li>
      )}
      {rows.map((row, index) =>
        row.kind === 'hint' ? (
          <li key={index} className="flex items-center gap-2 rounded-[10px] bg-white/[0.04] px-2 py-1.5 text-footnote text-label-2">
            <Icon icon="solar:eye-linear" aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0">{fill(text.hintRow, { n: row.index + 1 })}</span>
            <SymbolChip id={row.symbol} className="size-7 shrink-0" />
            <span className="ml-auto shrink-0">{text.hintCost}</span>
          </li>
        ) : (
          <li
            key={index}
            aria-label={fill(text.guessLabel, { n: index + 1, exact: row.exact, partial: row.partial })}
            className="flex items-center justify-between gap-2 rounded-[10px] bg-white/[0.04] px-2 py-1.5"
          >
            <span aria-hidden="true" className="grid min-w-0 flex-1 gap-1" style={chipColumns}>
              {row.symbols.map((id, slot) => (
                <SymbolChip key={slot} id={id} className="aspect-square w-full" />
              ))}
            </span>
            <span aria-hidden="true" className="grid shrink-0 grid-cols-3 gap-1">
              {Array.from({ length: config.slots }, (_, peg) => (
                <span
                  key={peg}
                  className={`size-2.5 rounded-full ${
                    peg < row.exact ? 'bg-success' : peg < row.exact + row.partial ? 'bg-warning' : 'bg-white/15'
                  }`}
                />
              ))}
            </span>
          </li>
        ),
      )}
    </ol>
  );

  const currentRow = (
    <div
      className="grid shrink-0 justify-center gap-1.5"
      style={{ gridTemplateColumns: `repeat(${config.slots}, minmax(0, 2.5rem))` }}
    >
      {Array.from({ length: config.slots }, (_, slot) => (
        <span
          key={slot}
          role="img"
          aria-label={
            current[slot]
              ? `${fill(text.slot, { n: slot + 1 })}: ${text.symbols[current[slot]]}`
              : fill(text.slot, { n: slot + 1 })
          }
          className={`grid aspect-square w-full place-items-center rounded-[10px] bg-bg ring-1 ${
            slot === current.length && playing ? 'ring-white/50' : 'ring-white/10'
          }`}
        >
          {current[slot] ? (
            <Icon
              icon={SYMBOL_BY_ID[current[slot]].icon}
              aria-hidden="true"
              className={`size-[60%] ${SYMBOL_BY_ID[current[slot]].color}`}
            />
          ) : (
            <span aria-hidden="true" className="size-1 rounded-full bg-white/25" />
          )}
        </span>
      ))}
    </div>
  );

  const keyboard = (
    <div ref={keysRef} className="flex shrink-0 flex-col gap-2">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((symbol, index) => (
          <button
            key={symbol.id}
            type="button"
            onClick={() => add(symbol.id)}
            disabled={!playing || full}
            aria-label={text.symbols[symbol.id]}
            aria-keyshortcuts={index < 9 ? String(index + 1) : '0'}
            className="grid min-h-12 place-items-center rounded-control bg-white/[0.08] transition-[background-color,transform] duration-fast hover:bg-white/15 active:scale-95 active:bg-white/20 disabled:opacity-40"
          >
            <Icon icon={symbol.icon} aria-hidden="true" className={`size-6 ${symbol.color}`} />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={erase} disabled={!playing || current.length === 0} className="btn-secondary px-3">
          <Icon icon="solar:backspace-linear" aria-hidden="true" className="size-5" />
          {text.backspace}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!playing || !full}
          className={`${full && playing ? 'btn-primary' : 'btn-secondary'} px-3 font-mono font-semibold tracking-wide`}
        >
          {text.enter}
        </button>
      </div>
      <p className="hidden text-center text-caption text-label-2 can-hover:block">
        {fill(text.keysHelp, { n: Math.min(config.options, 9) })}
      </p>
    </div>
  );

  const ending = status !== 'playing' && (
    <ResultOverlay>
      {short ? null : status === 'won' ? (
        <Icon icon="solar:lock-unlocked-linear" aria-hidden="true" className="size-10 text-success" />
      ) : (
        <Icon icon="solar:shield-cross-linear" aria-hidden="true" className="size-10 text-danger" />
      )}
      <p className="text-title-2 text-label-1">{status === 'won' ? text.accessGranted : text.accessDenied}</p>
      <p className="text-callout text-label-2">
        {status === 'won' ? plural(text.cracked, rows.filter((row) => row.kind === 'guess').length) : text.codeWas}
      </p>
      <div role="img" aria-label={code.map((id) => text.symbols[id]).join(', ')} className="flex gap-1.5">
        {code.map((id, index) => (
          <SymbolChip key={index} id={id} className="size-9" />
        ))}
      </div>
      {newRecord && <NewRecord label={common.newRecord} />}
      <button
        type="button"
        onClick={() => startLevel(status === 'won' ? level + 1 : level)}
        className="btn-primary mt-1"
      >
        {status === 'won' ? common.nextLevel : common.tryAgain}
      </button>
    </ResultOverlay>
  );

  // Landscape phones: history on the left, input on the right. The legend goes beside the keyboard while
  // it is a single row of keys (there is room), otherwise under the history.
  if (landscape) {
    const legendBeside = keyRows === 1;
    return (
      <div className="relative flex h-full gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {stats}
          {history}
          {!legendBeside && legend}
        </div>
        <div className="flex w-[clamp(16rem,46%,22rem)] shrink-0 flex-col justify-end gap-2">
          {legendBeside && <div className="mb-auto pt-1">{legend}</div>}
          {currentRow}
          {keyboard}
        </div>
        {ending}
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-md flex-col gap-2">
      {stats}
      {legend}
      {history}
      {currentRow}
      {keyboard}
      {ending}
    </div>
  );
}
