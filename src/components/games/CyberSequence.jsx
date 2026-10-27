import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { Lives, NewRecord, ResultOverlay, Stat } from './GameUI';
import { moveGridFocus } from './gridKeys';
import { RECORD_KEYS, parseCount, saveRecord, useStoredRecord } from './records';
import { fill, plural } from './text';
import { useElementSize } from './useElementSize';
import { useGameKeys } from './useGameKeys';
import { useGameViewport } from './viewport';

// Four pads in a circle (the outer corners follow the board's round clip): green, red, yellow, blue.
// Keys 1–4 press them in reading order on a physical keyboard.
const PADS = [
  { id: 'green', key: '1', className: 'bg-success', frequency: 261.63 },
  { id: 'red', key: '2', className: 'bg-danger', frequency: 329.63 },
  { id: 'yellow', key: '3', className: 'bg-primary', frequency: 392.0 },
  { id: 'blue', key: '4', className: 'bg-data-1', frequency: 523.25 },
];

const STATUS_HEIGHT = 128; // fixed so the board never resizes when the message changes
const MAX_BOARD = 480;
const ROW_SIDE = 224 + 32; // side panel + gap in the row layout
const randomPad = () => PADS[Math.floor(Math.random() * PADS.length)].id;
const speedFor = (length) => Math.max(380, 820 - length * 35);

export default function CyberSequence() {
  const { t } = useLanguage();
  const text = t.minigames.sequence;
  const common = t.minigames.common;
  const viewport = useGameViewport();
  const { wide } = viewport;
  const best = parseCount(useStoredRecord(RECORD_KEYS.sequence)) ?? 0;

  const [sequence, setSequence] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | showing | input | between | over
  const [message, setMessage] = useState(null); // correct | wrong
  const [lit, setLit] = useState(null);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0); // rounds completed
  const [newRecord, setNewRecord] = useState(false);

  // Taps are accepted only while this is true: never during playback or the pause between rounds.
  const inputOpen = useRef(false);
  const step = useRef(0);
  const timers = useRef(new Set());
  const audio = useRef(null);
  const [areaRef, area] = useElementSize();

  const boardSize = Math.floor(
    wide
      ? Math.min(viewport.height, viewport.width - ROW_SIDE, MAX_BOARD)
      : Math.min(area.width, area.height - STATUS_HEIGHT - 16, MAX_BOARD),
  );

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
  };

  const later = (callback, delay) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      callback();
    }, delay);
    timers.current.add(id);
  };

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
      audio.current?.close?.().catch(() => {});
    };
  }, []);

  // One AudioContext, unlocked by the tap that starts the game (required on iOS).
  const getAudio = () => {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    if (!audio.current || audio.current.state === 'closed') audio.current = new Context();
    return audio.current;
  };

  const beep = (frequency) => {
    const context = getAudio();
    if (!context) return;
    const play = () => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.2, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.4);
    };
    if (context.state === 'suspended') context.resume().then(play, () => {});
    else play();
  };

  const flash = (id, duration) => {
    setLit(id);
    beep(PADS.find((pad) => pad.id === id).frequency);
    later(() => setLit((current) => (current === id ? null : current)), duration);
  };

  // Plays the sequence, then opens input. Always clears pending timers first: one timeline at a time.
  const play = (seq) => {
    clearTimers();
    inputOpen.current = false;
    step.current = 0;
    setLit(null);
    setMessage(null);
    setStatus('showing');
    const speed = speedFor(seq.length);
    seq.forEach((id, index) => later(() => flash(id, Math.min(350, speed * 0.6)), speed * 0.5 + index * speed));
    later(() => {
      setLit(null);
      inputOpen.current = true;
      setStatus('input');
    }, speed * 0.5 + seq.length * speed);
  };

  const start = () => {
    const context = getAudio();
    if (context?.state === 'suspended') context.resume().catch(() => {});
    const first = [randomPad()];
    setSequence(first);
    setLives(3);
    setScore(0);
    setNewRecord(false);
    play(first);
  };

  const press = (pad) => {
    if (!inputOpen.current) return;
    flash(pad.id, 250);

    if (pad.id === sequence[step.current]) {
      step.current += 1;
      if (step.current < sequence.length) return;

      inputOpen.current = false;
      const reached = sequence.length;
      setScore(reached);
      if (reached > best) {
        saveRecord(RECORD_KEYS.sequence, reached);
        setNewRecord(true);
      }
      setMessage('correct');
      setStatus('between');
      const next = [...sequence, randomPad()];
      later(() => {
        setSequence(next);
        play(next);
      }, 1100);
      return;
    }

    inputOpen.current = false;
    const remaining = lives - 1;
    setLives(remaining);
    if (remaining <= 0) {
      setMessage(null);
      setStatus('over');
      return;
    }
    setMessage('wrong');
    setStatus('between');
    later(() => play(sequence), 1200);
  };

  // Physical keyboard while the game is open: 1–4 press the pads, Enter / Space start a game.
  useGameKeys((event) => {
    const pad = PADS.find((item) => item.key === event.key);
    if (pad) {
      if (status !== 'input') return false;
      press(pad);
      return true;
    }
    if ((event.key === 'Enter' || event.key === ' ') && (status === 'idle' || status === 'over')) {
      start();
      return true;
    }
    return false;
  });

  const statusContent = (() => {
    if (status === 'idle') {
      return (
        <>
          <p className="max-w-xs text-callout text-label-2">{text.intro}</p>
          <button type="button" onClick={start} className="btn-primary">
            <Icon icon="solar:play-linear" aria-hidden="true" className="size-5" />
            {common.start}
          </button>
        </>
      );
    }
    if (status === 'over') return null;
    if (message === 'correct') {
      return (
        <p className="inline-flex items-center gap-2 text-callout font-semibold text-success">
          <Icon icon="solar:check-circle-linear" aria-hidden="true" className="size-5" />
          {fill(text.phaseComplete, { n: score })}
        </p>
      );
    }
    if (message === 'wrong') {
      return (
        <p className="inline-flex items-center gap-2 text-callout font-semibold text-danger">
          <Icon icon="solar:close-circle-linear" aria-hidden="true" className="size-5" />
          {plural(text.livesLeft, lives)}
        </p>
      );
    }
    if (status === 'showing') {
      return (
        <p className="inline-flex items-center gap-2 text-callout text-label-2">
          <Icon icon="solar:eye-linear" aria-hidden="true" className="size-5" />
          {text.watch}
        </p>
      );
    }
    return <p className="text-callout font-semibold text-label-1">{text.turn}</p>;
  })();

  const board = boardSize > 0 && (
    <div
      role="group"
      aria-label={text.board}
      onKeyDown={(event) => moveGridFocus(event, 2)}
      className="relative grid shrink-0 touch-none select-none grid-cols-2 gap-2 overflow-hidden rounded-full [-webkit-touch-callout:none]"
      style={{ width: boardSize, height: boardSize }}
    >
      {PADS.map((pad) => (
        <button
          key={pad.id}
          type="button"
          aria-label={text.colors[pad.id]}
          aria-keyshortcuts={pad.key}
          onClick={() => press(pad)}
          disabled={status !== 'input'}
          className={`grid place-items-center ${pad.className} transition-[opacity,filter] duration-100 ease-standard ${
            lit === pad.id ? 'opacity-100 brightness-110' : status === 'input' ? 'opacity-70 active:opacity-100' : 'opacity-40'
          }`}
        >
          <span
            aria-hidden="true"
            className="hidden min-w-6 rounded-pill bg-bg/40 px-1.5 text-center text-footnote font-semibold tabular-nums text-label-1 can-hover:block"
          >
            {pad.key}
          </span>
        </button>
      ))}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 grid size-[30%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface-1 ring-8 ring-surface-1"
      >
        <span className="flex flex-col items-center">
          <span className="text-title-1 tabular-nums text-label-1">{sequence.length || '–'}</span>
          <span className="text-caption text-label-2">{text.round}</span>
        </span>
      </div>
    </div>
  );

  const stats = (
    <>
      <Stat label={text.round} value={sequence.length || '–'} />
      <Lives count={lives} label={fill(common.livesLabel, { n: lives })} />
    </>
  );

  const over = status === 'over' && (
    <ResultOverlay>
      <p className="text-title-2 text-label-1">{common.gameOver}</p>
      <p className="text-callout text-label-2">{plural(text.reached, score)}</p>
      {newRecord && <NewRecord label={common.newRecord} />}
      <button type="button" onClick={start} className="btn-primary mt-1">
        <Icon icon="solar:restart-linear" aria-hidden="true" className="size-5" />
        {common.playAgain}
      </button>
    </ResultOverlay>
  );

  if (wide) {
    return (
      <div className="relative flex h-full items-center justify-center gap-8">
        {board}
        <div className="flex w-56 shrink-0 flex-col gap-5">
          <div className="flex items-center justify-between gap-4">{stats}</div>
          <div aria-live="polite" className="flex flex-col items-start gap-3">
            {statusContent}
          </div>
        </div>
        {over}
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-xl flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-4">{stats}</div>
      <div ref={areaRef} className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        {board}
        <div
          aria-live="polite"
          className="flex w-full shrink-0 flex-col items-center justify-center gap-3 text-center"
          style={{ height: STATUS_HEIGHT }}
        >
          {statusContent}
        </div>
      </div>
      {over}
    </div>
  );
}
