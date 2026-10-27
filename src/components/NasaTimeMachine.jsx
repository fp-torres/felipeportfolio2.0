import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useLanguage } from '../context/useLanguage';
import { APOD_FIRST_DATE, apodToday, isValidIsoDate, useApod } from '../hooks/useApod';
import { scrollToTarget } from '../lib/motion';
import ApodView from './lab/ApodView';

// Laboratório → "Máquina do tempo": the Astronomy Picture of any day since 16/06/1995.
// Lazy-loaded by the Footer and rendered inside its <Sheet>; the form resets every time the sheet closes.

// "Today" follows NASA's clock (New York). Read through useSyncExternalStore so rendering stays pure.
const subscribeNever = () => () => {};
const noDateOnServer = () => '';

function validate(value, today) {
  if (!value) return 'errorEmpty';
  if (!isValidIsoDate(value)) return 'errorInvalid';
  if (value < APOD_FIRST_DATE) return 'errorBefore';
  if (today && value > today) return 'errorAfter';
  return '';
}

export default function NasaTimeMachine() {
  const { t, lang } = useLanguage();
  const copy = t.footer.lab.travel;
  const today = useSyncExternalStore(subscribeNever, apodToday, noDateOnServer);
  const [value, setValue] = useState('');
  const [errorKey, setErrorKey] = useState('');
  const [date, setDate] = useState('');
  const inputRef = useRef(null);
  const resultRef = useRef(null);
  const inputId = useId();
  const messageId = useId();
  const apod = useApod({ date, lang, enabled: Boolean(date) });

  // On short screens the result starts below the fold: bring it up (respects "Reduce motion").
  useEffect(() => {
    const result = resultRef.current;
    if (!date || !result) return;
    if (result.getBoundingClientRect().top > window.innerHeight * 0.6) scrollToTarget(result);
  }, [date]);

  const onChange = (event) => {
    setValue(event.target.value);
    if (errorKey) setErrorKey('');
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const nextError = validate(value, apodToday());
    setErrorKey(nextError);
    if (nextError) {
      inputRef.current?.focus();
      return;
    }
    setDate(value);
  };

  // relative: screen-reader-only texts (absolute) stay inside the sheet's scrolling body. Anchored to the sheet
  // panel instead, they made it scrollable, and the scroll to the result pushed the sheet header off a landscape phone.
  return (
    <div className="relative">
      <p className="max-w-reading text-body text-label-2">{copy.intro}</p>

      <form noValidate onSubmit={onSubmit} className="mt-6">
        <label htmlFor={inputId} className="text-footnote font-medium text-label-2">
          {copy.dateLabel}
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:max-w-[30rem] sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <div className="relative">
              <input
                ref={inputRef}
                id={inputId}
                type="date"
                min={APOD_FIRST_DATE}
                max={today || undefined}
                value={value}
                onChange={onChange}
                required
                aria-invalid={errorKey ? true : undefined}
                aria-describedby={errorKey ? messageId : undefined}
                className="block h-12 w-full min-w-0 appearance-none rounded-control bg-surface-2 px-4 text-left text-body text-label-1 [color-scheme:dark] aria-[invalid=true]:outline-danger aria-[invalid=true]:[&:not(:focus)]:ring-1 aria-[invalid=true]:[&:not(:focus)]:ring-danger [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-date-and-time-value]:text-left"
              />
              {/* iOS Safari draws an empty date field as a blank box: give it a visible prompt. */}
              {!value && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-4 hidden items-center text-body text-label-3 [@supports(-webkit-touch-callout:none)]:flex"
                >
                  {copy.choose}
                </span>
              )}
            </div>
            {errorKey && (
              <p id={messageId} role="alert" className="mt-2 text-footnote text-danger">
                {copy[errorKey]}
              </p>
            )}
          </div>
          <button type="submit" className="btn-primary btn-lg w-full shrink-0 sm:w-auto">
            {copy.submit}
          </button>
        </div>
      </form>

      {date && (
        <div ref={resultRef} className="mt-8 scroll-mt-4">
          <ApodView resource={apod} date={date} />
        </div>
      )}
    </div>
  );
}
