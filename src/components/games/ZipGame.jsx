import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/useLanguage';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion as Motion } from 'framer-motion';

const TIME_PER_QUESTION = 20;

function getSavedZipHighScore() {
  try {
    return Number.parseInt(localStorage.getItem('zipHighScore') || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export default function ZipGame({ onBack }) {
  const { t } = useLanguage();
  const levels = t?.minigames?.zip?.levels || [];
  const txt    = t?.minigames?.zip;
  const common = t?.minigames?.common;

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [userInput,         setUserInput]          = useState('');
  const [score,             setScore]              = useState(0);
  const [lives,             setLives]              = useState(3);
  const [status,            setStatus]             = useState('playing');
  const [feedback,          setFeedback]           = useState(null);
  const [highScore,         setHighScore]          = useState(getSavedZipHighScore);
  const [hintVisible,       setHintVisible]        = useState(false);
  const [timeLeft,          setTimeLeft]           = useState(TIME_PER_QUESTION);

  const inputRef     = useRef(null);
  const timerRef     = useRef(null);
  const feedbackTimerRef = useRef(null);
  const handleTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      if (isMountedRef.current) inputRef.current?.focus();
    });
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (!isMountedRef.current) return;
    setTimeLeft(TIME_PER_QUESTION);

    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) { clearInterval(timerRef.current); return; }
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeoutRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleTimeout = useCallback(() => {
    if (!isMountedRef.current) return;

    const nextLives = lives - 1;
    setFeedback('wrong');
    setLives(nextLives);
    window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      setFeedback(null);
      setUserInput('');
      setHintVisible(false);
      if (nextLives <= 0) {
        setStatus('gameover');
      } else {
        startTimer();
        focusInput();
      }
    }, 1000);
  }, [focusInput, lives, startTimer]);

  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  }, [handleTimeout]);

  useEffect(() => {
    isMountedRef.current = true;
    focusInput();

    return () => {
      isMountedRef.current = false;
      clearInterval(timerRef.current);
      window.clearTimeout(feedbackTimerRef.current);
    };
  }, [focusInput]);

  useEffect(() => {
    if (status !== 'playing') {
      clearInterval(timerRef.current);
      return undefined;
    }

    const startDelay = window.setTimeout(startTimer, 0);
    return () => window.clearTimeout(startDelay);
  }, [currentLevelIndex, startTimer, status]);

  const currentLevel = levels[currentLevelIndex];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (status !== 'playing') return;

    const cleanInput  = userInput.trim().toUpperCase();
    const cleanAnswer = currentLevel?.answer?.toUpperCase();
    if (!cleanInput) return;

    clearInterval(timerRef.current);

    if (cleanInput === cleanAnswer) {
      const bonus    = Math.ceil((timeLeft / TIME_PER_QUESTION) * 50);
      const newScore = score + 100 + bonus;

      setFeedback('correct');
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('zipHighScore', newScore.toString());
      }

      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = window.setTimeout(() => {
        if (!isMountedRef.current) return;
        setFeedback(null);
        setUserInput('');
        setHintVisible(false);
        if (currentLevelIndex + 1 < levels.length) {
          setCurrentLevelIndex(prev => prev + 1);
        } else {
          setStatus('won');
        }
      }, 900);
    } else {
      setFeedback('wrong');
      const newLives = lives - 1;
      setLives(newLives);

      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = window.setTimeout(() => {
        if (!isMountedRef.current) return;
        setFeedback(null);
        setUserInput('');
        if (newLives <= 0) {
          setStatus('gameover');
        } else {
          startTimer();
          focusInput();
        }
      }, 900);
    }
  };

  const restartGame = () => {
    clearInterval(timerRef.current);
    window.clearTimeout(feedbackTimerRef.current);
    setCurrentLevelIndex(0);
    setScore(0);
    setLives(3);
    setStatus('playing');
    setUserInput('');
    setFeedback(null);
    setHintVisible(false);
    focusInput();
  };

  const timerColor =
    timeLeft <= 5  ? 'text-red-400'    :
    timeLeft <= 10 ? 'text-yellow-400' : 'text-green-400';

  const timerPct = (timeLeft / TIME_PER_QUESTION) * 100;
  const timerBar =
    timerPct <= 25 ? 'bg-red-500'    :
    timerPct <= 50 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0d1117] rounded-3xl border border-gray-800 p-4 sm:p-6 shadow-2xl font-mono relative overflow-hidden">

      {/* CRT scan-lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none opacity-20 bg-[length:100%_2px,3px_100%]" />

      {/* ── Header ── */}
      <div className="relative z-10 flex flex-wrap justify-between items-start gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <Icon icon="solar:arrow-left-bold" /> {common?.exit ?? 'Exit'}
        </button>

        <div className="flex flex-col items-end gap-1">
          <div className="text-xs text-gray-500 whitespace-nowrap">
            {common?.level ?? 'Level'} {currentLevelIndex + 1}/{levels.length}
          </div>
          <div className="flex gap-1 mt-0.5">
            {[...Array(3)].map((_, i) => (
              <Icon
                key={i}
                icon="solar:heart-bold"
                className={i < lives ? 'text-red-500' : 'text-gray-800'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Title Banner ── */}
      <div className="relative z-10 text-center mb-4">
        <div className="inline-flex items-center gap-2 border border-green-900/60 bg-green-950/30 rounded-full px-4 py-1.5">
          <Icon icon="solar:code-bold" className="text-green-500 text-sm" />
          <span className="text-sm font-bold text-green-400 tracking-widest uppercase">
            {txt?.title ?? 'Logic Quiz'}
          </span>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="relative z-10 min-h-[260px] flex flex-col items-center justify-center py-2">

        {status === 'playing' && currentLevel && (
          <>
            <Motion.div
              key={currentLevel.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-5 w-full text-center"
            >
              <div className="text-green-500 text-xs mb-2 tracking-widest opacity-70">
                /// {txt?.subtitle ?? txt?.title ?? 'LOGIC QUIZ'} ///
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 break-words px-2">
                {currentLevel.question}
              </h2>

              {/* Timer bar */}
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-1 overflow-hidden max-w-xs mx-auto">
                <Motion.div
                  className={`h-1.5 rounded-full transition-colors ${timerBar}`}
                  animate={{ width: `${timerPct}%` }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                />
              </div>
              <div className={`text-xs font-mono mb-3 ${timerColor}`}>{timeLeft}s</div>

              {/* Hint toggle */}
              <button
                onClick={() => setHintVisible(v => !v)}
                className="text-xs text-gray-600 hover:text-yellow-400 transition-colors flex items-center gap-1 mx-auto mb-1"
              >
                <Icon icon="solar:eye-bold" />
                {hintVisible
                  ? (txt?.hideHint ?? 'Hide hint')
                  : (txt?.showHint ?? 'Show hint')}
              </button>

              <AnimatePresence>
                {hintVisible && (
                  <Motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-xs text-yellow-500 overflow-hidden"
                  >
                    {txt?.hint ?? 'Hint:'} {currentLevel.hint}
                  </Motion.p>
                )}
              </AnimatePresence>
            </Motion.div>

            {/* Input */}
            <div className="relative max-w-xs w-full mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className={`w-full bg-black/50 border-2 rounded-lg px-4 py-3 pr-14 text-center text-lg sm:text-xl text-white outline-none focus:border-green-500 transition-all ${
                  feedback === 'wrong'   ? 'border-red-500'   :
                  feedback === 'correct' ? 'border-green-500' : 'border-gray-700'
                }`}
                placeholder={txt?.placeholder ?? 'Answer...'}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="absolute right-2 top-2 bottom-2 bg-green-600 hover:bg-green-500 text-black px-3 rounded font-bold transition-colors"
              >
                <Icon icon="solar:arrow-right-bold" />
              </button>
            </div>

            {/* Feedback */}
            <div className="h-8 flex items-center justify-center mt-3">
              <AnimatePresence mode="wait">
                {feedback === 'correct' && (
                  <Motion.div
                    key="ok"
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -6, opacity: 0 }}
                    className="text-green-400 font-bold flex items-center gap-2 text-sm"
                  >
                    <Icon icon="solar:verified-check-bold" />
                    {txt?.correct ?? 'CORRECT!'}
                    {Math.ceil((timeLeft / TIME_PER_QUESTION) * 50) > 0 && (
                      <span className="text-yellow-400 text-xs">
                        +{Math.ceil((timeLeft / TIME_PER_QUESTION) * 50)} {txt?.bonus ?? 'bonus'}
                      </span>
                    )}
                  </Motion.div>
                )}
                {feedback === 'wrong' && (
                  <Motion.div
                    key="err"
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -6, opacity: 0 }}
                    className="text-red-400 font-bold flex items-center gap-2 text-sm"
                  >
                    <Icon icon="solar:close-circle-bold" /> {txt?.wrong ?? 'WRONG!'}
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ── Game Over ── */}
        {status === 'gameover' && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
            <Icon icon="solar:bomb-emoji-bold" className="text-red-500 text-6xl mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">{common?.gameOver ?? 'Game Over'}</h3>
            <div className="text-xl font-mono text-green-400 mb-8">
              {common?.score ?? 'Score'}: {score}
            </div>
            <button
              onPointerDown={restartGame}
              className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              {common?.restart ?? 'Restart'}
            </button>
          </Motion.div>
        )}

        {/* ── Won ── */}
        {status === 'won' && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
            <Icon
              icon="solar:cup-star-bold"
              className="text-yellow-400 text-6xl mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"
            />
            <h3 className="text-2xl font-bold text-white mb-2">{txt?.hackComplete ?? 'HACK COMPLETE!'}</h3>
            <div className="text-xl font-mono text-green-400 mb-8">
              {common?.score ?? 'Score'}: {score}
            </div>
            <button
              onPointerDown={restartGame}
              className="bg-green-500 text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              {common?.playAgain ?? 'Play Again'}
            </button>
          </Motion.div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-800 pt-3 flex flex-wrap justify-between gap-2 text-xs text-gray-600 font-mono relative z-10 mt-2">
        <span>ZIP_PROTOCOL_V2.0</span>
        <span>{(common?.record ?? 'Record').toUpperCase()}: {highScore}</span>
      </div>
    </div>
  );
}
