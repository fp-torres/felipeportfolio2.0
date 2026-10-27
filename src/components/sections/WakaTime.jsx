import { useId, useMemo, useState } from 'react';
import { m as Motion } from 'framer-motion';
import { useLanguage } from '../../context/useLanguage';
import { DEFAULT_WAKATIME_RANGE, WAKATIME_RANGES, useWakaTime } from '../../hooks/useWakaTime';
import { DUR, EASE } from '../../lib/motion';
import Segmented from '../ui/Segmented';
import { useHydrated, useToday } from '../activity/clientValues';
import { fill, formatDuration, formatStamp, freshnessNote, localeFor } from '../activity/format';
import { ErrorBlock, StatusNote } from '../activity/parts';

// Categorical chart palette; "Other"/"Text" and the unlisted remainder share the neutral grey.
const COLORS = ['bg-data-1', 'bg-data-2', 'bg-data-3', 'bg-data-4', 'bg-data-5', 'bg-data-6'];
const NEUTRAL_COLOR = 'bg-data-7';
const NEUTRAL = new Set(['other', 'text', 'unknown']);
// Preferred palette slots, so a language keeps its colour when the period changes.
const PREFERRED = {
  typescript: [0],
  javascript: [2],
  python: [4, 0],
  java: [5, 2],
  php: [3, 5],
  markdown: [3, 5],
  bash: [1],
  shell: [1],
  'shell script': [1],
  powershell: [1],
  html: [2, 5],
  css: [4, 0],
  sql: [5, 3],
  json: [2, 4],
  yaml: [5, 1],
};
const OTHERS_KEY = '__others';

// Top languages + one "Others" bucket (neutral categories, extra languages and time the bridge didn't list),
// so the legend adds up to the total shown above it.
function buildSegments(data, othersLabel) {
  const languages = data?.languages ?? [];
  if (languages.length === 0) return [];

  const bySeconds = languages.every((language) => language.seconds !== null);
  const weightOf = (language) => (bySeconds ? language.seconds : (language.percent ?? 0));
  const isNeutral = (language) => NEUTRAL.has(language.name.toLowerCase());

  const named = languages.filter((language) => !isNeutral(language)).sort((a, b) => weightOf(b) - weightOf(a));
  const rest = [...languages.filter(isNeutral), ...named.slice(COLORS.length)];
  const listed = languages.reduce((sum, language) => sum + weightOf(language), 0);
  const whole = bySeconds ? data.totalSeconds : 100;
  const othersWeight = rest.reduce((sum, language) => sum + weightOf(language), 0) + (whole !== null ? Math.max(0, whole - listed) : 0);

  const used = new Set();
  const segments = named.slice(0, COLORS.length).map((language) => {
    const preferred = (PREFERRED[language.name.toLowerCase()] ?? []).find((slot) => !used.has(slot));
    const slot = preferred ?? COLORS.findIndex((_, index) => !used.has(index));
    used.add(slot);
    return { key: language.name, name: language.name, weight: weightOf(language), seconds: language.seconds, color: COLORS[slot] };
  });

  if (othersWeight >= (bySeconds ? 60 : 0.5)) {
    const othersSeconds = bySeconds ? othersWeight : data.totalSeconds !== null ? (data.totalSeconds * othersWeight) / 100 : null;
    segments.push({ key: OTHERS_KEY, name: othersLabel, weight: othersWeight, seconds: othersSeconds, color: NEUTRAL_COLOR });
  }

  const total = segments.reduce((sum, segment) => sum + segment.weight, 0);
  return segments.map((segment) => ({ ...segment, share: total > 0 ? segment.weight / total : 0 }));
}

function WakaSkeleton() {
  return (
    <div aria-hidden="true" className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-x-8">
      <div className="lg:col-span-4">
        <span className="skeleton block h-8 w-40 rounded-control lg:h-9" />
        <span className="skeleton mt-2 block h-5 w-56 max-w-full rounded-pill" />
      </div>
      <div className="lg:col-span-8 lg:row-span-2">
        <span className="skeleton block h-3 w-full rounded-pill" />
        <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
          {[0, 1, 2, 3, 4].map((row) => (
            <li key={row} className="flex min-h-9 items-center gap-3">
              <span className="skeleton block size-2 shrink-0 rounded-full" />
              <span className="skeleton block h-4 w-24 rounded-pill" />
              <span className="skeleton ml-auto block h-4 w-16 rounded-pill" />
            </li>
          ))}
        </ul>
      </div>
      <span className="skeleton block h-4 w-44 max-w-full rounded-pill lg:col-span-4 lg:self-end" />
    </div>
  );
}

// range/onRangeChange are optional: Activity controls them so its stat tile follows the same period.
export default function WakaTime({ range: controlledRange, onRangeChange, enabled = true }) {
  const { t, lang } = useLanguage();
  const copy = t.activity.wakatime;
  const locale = localeFor(lang);
  const titleId = useId();
  const hydrated = useHydrated();
  const today = useToday();
  const [ownRange, setOwnRange] = useState(DEFAULT_WAKATIME_RANGE);
  const range = controlledRange ?? ownRange;
  const setRange = onRangeChange ?? setOwnRange;
  const { data: cached, status, error, savedAt, retry } = useWakaTime(range, { enabled });
  const data = hydrated ? cached : undefined;
  const segments = useMemo(() => buildSegments(data, copy.others), [data, copy.others]);

  if (!data && error?.code === 'NOT_CONFIGURED') return null;

  // While a newly selected period loads, the previous one stays on screen, dimmed.
  const switching = Boolean(data) && data.range !== range;
  const showData = Boolean(data) && !(switching && status === 'error');
  const options = WAKATIME_RANGES.map((value) => ({ value, label: copy.ranges[value] }));
  const total = formatDuration(data?.totalSeconds, locale);
  const average = formatDuration(data?.dailyAverageSeconds, locale);
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });

  const note = showData
    ? freshnessNote(formatStamp(data.updatedAt ?? data.fetchedAt ?? savedAt, locale, today), status === 'stale' || data.stale, t)
    : null;

  const busy = showData ? switching : status !== 'error';

  return (
    <article aria-labelledby={titleId} aria-busy={busy || undefined} className="rounded-card bg-surface-2 p-card">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 id={titleId} className="text-title-3 text-label-1">
          {copy.title}
        </h3>
        <Segmented
          options={options}
          value={range}
          onChange={setRange}
          label={copy.rangeLabel}
          fullWidth
          className="sm:w-auto [&>button]:px-3 sm:[&>button]:flex-none sm:[&>button]:px-4"
        />
      </header>

      {showData && (
        <div
          className={`mt-6 grid gap-6 transition-opacity duration-base ease-standard lg:grid-cols-12 lg:gap-x-8 ${
            switching ? 'opacity-60' : ''
          }`}
        >
          <div className="lg:col-span-4">
            {total && <p className="text-title-1 tabular-nums text-label-1">{total}</p>}
            {average && (
              <p className="mt-1 text-callout tabular-nums text-label-2">{fill(copy.dailyAverage, { time: average })}</p>
            )}
          </div>

          <div className="lg:col-span-8 lg:row-span-2">
            {segments.length > 0 ? (
              <>
                <Motion.div
                  aria-hidden="true"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: DUR.slower, ease: EASE.emphasized }}
                  style={{ originX: 0 }}
                  className="flex h-3 gap-[2px] overflow-hidden rounded-pill bg-white/[0.08]"
                >
                  {segments.map((segment) => (
                    <span
                      key={segment.key}
                      className={`h-full min-w-[3px] transition-[width] duration-slow ease-emphasized ${segment.color}`}
                      style={{ width: `${segment.share * 100}%` }}
                    />
                  ))}
                </Motion.div>

                <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
                  {segments.map((segment) => (
                    <li key={segment.key} className="flex min-h-9 items-center gap-3">
                      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${segment.color}`} />
                      <span className="min-w-0 flex-1 truncate text-callout text-label-1">{segment.name}</span>
                      <span className="shrink-0 text-callout tabular-nums text-label-2">
                        {formatDuration(segment.seconds, locale) ?? percent.format(segment.share)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-callout text-label-2">{copy.empty}</p>
            )}
          </div>

          {/* ≥1024: a 36px box centred like the legend rows, so the note lines up with the last row. */}
          {note && (
            <StatusNote tone={note.tone} className="lg:col-span-4 lg:min-h-9 lg:self-end lg:pt-[0.5625rem]">
              {note.text}
            </StatusNote>
          )}
        </div>
      )}

      {!showData && status === 'error' && <ErrorBlock onRetry={retry} className="mt-4" />}
      {!showData && status !== 'error' && <WakaSkeleton />}
    </article>
  );
}
