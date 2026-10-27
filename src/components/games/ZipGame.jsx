import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { Lives, NewRecord, Stat } from './GameUI';
import { RECORD_KEYS, parseCount, saveRecord, useStoredRecord } from './records';
import { fill } from './text';
import { useGameViewport } from './viewport';

const SECONDS = 20;
const FEEDBACK_MS = 900;

// Case, accents, spaces and punctuation never decide an answer: "Quinta-feira" = "QUINTAFEIRA", "Vue.js" = "VUEJS".
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-z]/gi, '')
    .toUpperCase();

export default function ZipGame() {
  const { t } = useLanguage();
  const text = t.minigames.zip;
  const common = t.minigames.common;
  const levels = text.levels;
  const { wide, short } = useGameViewport();
  const best = parseCount(useStoredRecord(RECORD_KEYS.zip)) ?? 0;

  const [status, setStatus] = useState('idle'); // idle | playing | over | won
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [points, setPoints] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState(null); // correct | wrong | timeout
  const [bonus, setBonus] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [newRecord, setNewRecord] = useState(false);

  const inputRef = useRef(null);
  const deadline = useRef(0);
  const locked = useRef(false); // one answer per question: double Enter / double tap can't count twice
  const feedbackTimer = useRef(0);
  const timeUpRef = useRef(null);
  const level = levels[index];

  useEffect(() => () => window.clearTimeout(feedbackTimer.current), []);

  // Countdown while a question is open (paused during feedback).
  useEffect(() => {
    if (status !== 'playing' || feedback) return undefined;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) timeUpRef.current?.();
    }, 250);
    return () => window.clearInterval(id);
  }, [status, feedback, index]);

  const resolve = (result, gained = 0) => {
    if (locked.current) return;
    locked.current = true;
    setFeedback(result);

    let remaining = lives;
    if (result === 'correct') {
      const total = points + 100 + gained;
      setPoints(total);
      setBonus(gained);
      if (total > best) {
        saveRecord(RECORD_KEYS.zip, total);
        setNewRecord(true);
      }
    } else {
      remaining = lives - 1;
      setLives(remaining);
    }

    feedbackTimer.current = window.setTimeout(() => {
      locked.current = false;
      setFeedback(null);
      setAnswer('');
      setHintOpen(false);
      if (remaining <= 0) {
        setStatus('over');
        return;
      }
      if (result === 'correct') {
        if (index + 1 >= levels.length) {
          setStatus('won');
          return;
        }
        setIndex(index + 1);
      }
      deadline.current = Date.now() + SECONDS * 1000;
      setTimeLeft(SECONDS);
    }, FEEDBACK_MS);
  };

  useEffect(() => {
    timeUpRef.current = () => resolve('timeout');
  });

  const start = () => {
    window.clearTimeout(feedbackTimer.current);
    locked.current = false;
    deadline.current = Date.now() + SECONDS * 1000;
    // Render the input now so focusing it still counts as part of the tap (opens the keyboard on iOS).
    flushSync(() => {
      setIndex(0);
      setAnswer('');
      setPoints(0);
      setLives(3);
      setFeedback(null);
      setHintOpen(false);
      setTimeLeft(SECONDS);
      setNewRecord(false);
      setStatus('playing');
    });
    inputRef.current?.focus({ preventScroll: true });
  };

  const submit = (event) => {
    event.preventDefault();
    if (status !== 'playing' || locked.current || !level) return;
    const value = normalize(answer);
    if (!value) return;
    const accepted = [level.answer, ...(level.accept ?? [])].map(normalize);
    if (accepted.includes(value)) resolve('correct', Math.ceil((timeLeft / SECONDS) * 50));
    else resolve('wrong');
  };

  if (status !== 'playing') {
    const finished = status === 'over' || status === 'won';
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        {status === 'idle' && (
          <>
            <p className="max-w-xs text-callout text-label-2">
              {fill(text.intro, { total: levels.length, seconds: SECONDS })}
            </p>
            <button type="button" onClick={start} className="btn-primary mt-1">
              <Icon icon="solar:play-linear" aria-hidden="true" className="size-5" />
              {common.start}
            </button>
          </>
        )}
        {finished && (
          <>
            {status === 'won' ? (
              <Icon icon="solar:cup-star-linear" aria-hidden="true" className="size-10 text-label-1" />
            ) : (
              <Icon icon="solar:close-circle-linear" aria-hidden="true" className="size-10 text-label-2" />
            )}
            <p className="text-title-2 text-label-1">{status === 'won' ? text.hackComplete : common.gameOver}</p>
            <p className="text-callout tabular-nums text-label-2">
              {common.score}: {points}
            </p>
            {newRecord && <NewRecord label={common.newRecord} />}
            <button type="button" onClick={start} className="btn-primary mt-1">
              <Icon icon="solar:restart-linear" aria-hidden="true" className="size-5" />
              {common.playAgain}
            </button>
          </>
        )}
      </div>
    );
  }

  const timerColor = timeLeft <= 5 ? 'bg-danger' : timeLeft <= 10 ? 'bg-warning' : 'bg-success';
  const canSubmit = feedback === null && answer.trim() !== '';

  const header = (
    <div className="flex shrink-0 items-center gap-6">
      <Stat label={text.questionLabel} value={`${index + 1}/${levels.length}`} />
      <Stat label={common.score} value={points} />
      <div className="ml-auto">
        <Lives count={lives} label={fill(common.livesLabel, { n: lives })} />
      </div>
    </div>
  );

  const question = (
    <div className="shrink-0 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-white/10">
          <div
            className={`h-full rounded-pill transition-[width,background-color] duration-[250ms] ease-linear ${timerColor}`}
            style={{ width: `${(timeLeft / SECONDS) * 100}%` }}
          />
        </div>
        <span className="w-10 text-right text-footnote tabular-nums text-label-2">
          {fill(text.seconds, { n: timeLeft })}
        </span>
      </div>
      <p className="rounded-tile bg-bg px-4 py-4 text-center font-mono text-title-2 text-label-1 ring-1 ring-white/10 sm:py-6">
        {level.question}
      </p>
    </div>
  );

  const answerArea = (
    <div className="shrink-0 space-y-2">
      <form onSubmit={submit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          readOnly={feedback !== null}
          aria-label={text.answerLabel}
          placeholder={text.placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          enterKeyHint="send"
          className={`h-12 min-w-0 flex-1 rounded-control bg-bg px-4 text-center font-mono text-body text-label-1 ring-1 transition-shadow placeholder:text-label-3 ${
            feedback === 'correct' ? 'ring-2 ring-success' : feedback ? 'ring-2 ring-danger' : 'ring-white/15'
          }`}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label={text.submit}
          className={`${canSubmit ? 'btn-primary' : 'btn-secondary'} size-12 shrink-0 px-0`}
        >
          <Icon icon="solar:arrow-right-linear" aria-hidden="true" className="size-5" />
        </button>
      </form>
      <div className="flex min-h-tap flex-wrap items-center justify-between gap-x-4">
        <button
          type="button"
          onClick={() => setHintOpen((open) => !open)}
          aria-expanded={hintOpen}
          className="inline-flex min-h-tap items-center gap-1.5 text-callout text-label-2 transition-colors hover:text-label-1"
        >
          <Icon icon="solar:lightbulb-minimalistic-linear" aria-hidden="true" className="size-5" />
          {hintOpen ? text.hideHint : text.showHint}
        </button>
        <p aria-live="polite" className="text-callout font-semibold">
          {feedback === 'correct' && (
            <span className="text-success">
              {text.correct} {bonus > 0 && <span className="font-normal">{fill(text.bonus, { n: bonus })}</span>}
            </span>
          )}
          {feedback === 'wrong' && <span className="text-danger">{text.wrong}</span>}
          {feedback === 'timeout' && <span className="text-danger">{text.timeUp}</span>}
        </p>
      </div>
      {hintOpen && <p className="text-callout text-label-2">{level.hint}</p>}
    </div>
  );

  // Landscape phones: question on the left, answer on the right.
  if (wide && short) {
    return (
      <div className="flex h-full flex-col gap-3">
        {header}
        <div className="grid min-h-0 flex-1 grid-cols-2 items-center gap-6">
          {question}
          {answerArea}
        </div>
      </div>
    );
  }

  // One centred column; on phones it sits high, clear of the on-screen keyboard.
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col gap-4 sm:justify-center">
      {header}
      {question}
      {answerArea}
    </div>
  );
}
