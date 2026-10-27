import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/useLanguage';
import { GITHUB_PROFILE_URL, useGithubData } from '../../hooks/useGithubData';
import { useHydrated, useToday } from '../activity/clientValues';
import { fill, formatStamp, freshnessNote, isKnown, localeFor, plural } from '../activity/format';
import { ErrorBlock, StatusNote } from '../activity/parts';

// Neutral white ramp (level 0 = no contributions), not GitHub's green.
const LEVELS = ['bg-white/[0.06]', 'bg-white/[0.18]', 'bg-white/[0.36]', 'bg-white/[0.60]', 'bg-white/[0.92]'];
const LABELED_WEEKDAYS = [1, 3, 5]; // Mon, Wed, Fri
const MIN_LABEL_GAP = 3; // columns: closer month labels would collide

// Buckets raw counts into 5 levels using quartiles of the active days (like GitHub's own calendar).
function buildLevelResolver(weeks) {
  const counts = weeks
    .flatMap((week) => week.days.map((day) => day.count))
    .filter((count) => count > 0)
    .sort((a, b) => a - b);

  if (counts.length === 0) return () => 0;

  const quantile = (p) => counts[Math.min(counts.length - 1, Math.floor(p * counts.length))];
  const q1 = quantile(0.25);
  const q2 = quantile(0.5);
  const q3 = quantile(0.75);

  return (count) => {
    if (count <= 0) return 0;
    if (count <= q1) return 1;
    if (count <= q2) return 2;
    if (count <= q3) return 3;
    return 4;
  };
}

function buildColumns(weeks) {
  return weeks.map((week) => {
    const column = Array(7).fill(null);
    week.days.forEach((day) => {
      column[day.weekday] = day;
    });
    return column;
  });
}

function buildMonthLabels(columns, locale) {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
  const labels = [];
  let lastMonth = null;

  columns.forEach((column, index) => {
    const days = column.filter(Boolean);
    if (days.length === 0) return;

    // The column's dominant month avoids labelling a one- or two-day sliver at a week boundary.
    const counts = {};
    days.forEach((day) => {
      const month = day.date.slice(0, 7);
      counts[month] = (counts[month] || 0) + 1;
    });
    const month = Object.keys(counts).reduce((a, b) => (counts[a] >= counts[b] ? a : b));
    if (month === lastMonth) return;
    lastMonth = month;

    const previous = labels[labels.length - 1];
    if (previous && index - previous.index < MIN_LABEL_GAP) {
      // A sliver of a month in the first columns gives way to the next label; otherwise skip this one.
      if (previous.index !== 0) return;
      labels.pop();
    }
    const sample = days.find((day) => day.date.startsWith(month));
    labels.push({ index, text: formatter.format(new Date(`${sample.date}T00:00:00`)) });
  });

  return labels;
}

function dayFromEvent(event) {
  const cell = event.target instanceof Element ? event.target.closest('[data-date]') : null;
  return cell ? { date: cell.dataset.date, count: Number(cell.dataset.count) || 0 } : null;
}

export default function GithubContributions({ enabled = true }) {
  const { t, lang } = useLanguage();
  const copy = t.activity.github;
  const locale = localeFor(lang);
  const titleId = useId();
  const hydrated = useHydrated();
  const today = useToday();
  const { data: cached, status, error, savedAt, retry } = useGithubData({ enabled });
  const data = hydrated ? cached : undefined;

  const scrollerRef = useRef(null);
  const fadeRef = useRef(null);
  const pinnedRef = useRef(true); // keep the latest weeks in view until the visitor scrolls back in time
  // hidden: month labels (column indexes, space-separated) under an edge fade — see measure().
  const [edges, setEdges] = useState({ start: false, end: false, hidden: '' });
  const [picked, setPicked] = useState(null); // day tapped/clicked
  const [hovered, setHovered] = useState(null); // day under the mouse

  const weeks = data?.weeks;
  const columns = useMemo(() => (weeks ? buildColumns(weeks) : []), [weeks]);
  const monthLabels = useMemo(() => buildMonthLabels(columns, locale), [columns, locale]);
  const levelOf = useMemo(() => buildLevelResolver(weeks ?? []), [weeks]);
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 7 Jan 2024 was a Sunday (weekday 0).
    return Array.from({ length: 7 }, (_, weekday) =>
      LABELED_WEEKDAYS.includes(weekday) ? formatter.format(new Date(2024, 0, 7 + weekday)) : '',
    );
  }, [locale]);
  // "21 de out. de 2026": short months keep the tap/hover readout on one line on most phones.
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
    [locale],
  );
  const maxCount = useMemo(
    () => (weeks ?? []).reduce((max, week) => week.days.reduce((m, day) => Math.max(m, day.count), max), 0),
    [weeks],
  );
  // The longest readouts a day can produce. Laid out invisibly under the subtitle (also while loading), they
  // reserve its height, so tapping a day never pushes the calendar down (a long readout wraps on a 320px phone).
  const readoutProbes = useMemo(() => {
    let longestDate = '';
    for (let month = 0; month < 12; month += 1) {
      // Day 28 of each month of a sample year: a two-digit day with every month's name (they differ in length).
      const text = dateFormatter.format(new Date(2026, month, 28));
      if (text.length > longestDate.length) longestDate = text;
    }
    const n = new Intl.NumberFormat(locale).format(Math.max(maxCount, 99));
    return [fill(copy.day.none, { date: longestDate }), fill(copy.day.other, { n, date: longestDate })];
  }, [dateFormatter, locale, copy.day, maxCount]);
  // "out. de 2025 – out. de 2026": the calendar's period, shown when the profile counts are unknown.
  const period = useMemo(() => {
    if (!weeks?.length) return null;
    const lastWeek = weeks[weeks.length - 1].days;
    const first = weeks[0].days[0].date;
    const last = lastWeek[lastWeek.length - 1].date;
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });
    const [from, to] = [new Date(`${first}T00:00:00`), new Date(`${last}T00:00:00`)];
    return formatter.formatRange ? formatter.formatRange(from, to) : `${formatter.format(from)} – ${formatter.format(to)}`;
  }, [weeks, locale]);

  // Edge fades show that the calendar scrolls; recomputed on scroll and resize (never during render).
  // A month label that starts under a fade, or is cut by the edge, would read like a typo ("ul." for "jul."):
  // it fades out until the visitor scrolls it clear of the edge.
  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft < max - 1;
    pinnedRef.current = !end;
    const fade = fadeRef.current?.offsetWidth ?? 0;
    const from = start ? el.scrollLeft + fade : -Infinity;
    const to = end ? el.scrollLeft + el.clientWidth - fade : Infinity;
    const hiddenLabels = [];
    el.querySelectorAll('[data-month]').forEach((label) => {
      if (label.offsetLeft < from || label.offsetLeft + label.offsetWidth > to) hiddenLabels.push(label.dataset.month);
    });
    const hidden = hiddenLabels.join(' ');
    setEdges((prev) =>
      prev.start === start && prev.end === end && prev.hidden === hidden ? prev : { start, end, hidden },
    );
  }, []);

  const weekCount = columns.length;
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!weekCount || !el) return undefined;
    // Open on the most recent weeks (right edge); older months are a swipe away.
    if (pinnedRef.current) el.scrollLeft = el.scrollWidth;
    if (typeof ResizeObserver === 'undefined') return undefined;
    // Its first call also measures new month labels (other data, other language).
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) el.scrollLeft = el.scrollWidth;
      measure();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [weekCount, monthLabels, measure]);

  if (!data && error?.code === 'NOT_CONFIGURED') return null;

  const onPick = (event) => {
    const day = dayFromEvent(event);
    if (day) setPicked((prev) => (prev?.date === day.date ? null : day));
  };
  const onHover = (event) => {
    if (event.pointerType !== 'mouse') return;
    const day = dayFromEvent(event);
    setHovered((prev) => (prev?.date === day?.date ? prev : day));
  };
  const clearHover = () => setHovered(null);

  const active = hovered ?? picked;
  const hiddenMonths = new Set(edges.hidden.split(' '));
  const numbers = new Intl.NumberFormat(locale);
  // "24 repositórios · 8 seguidores" — only the counts the bridge actually knows (never a fake 0).
  const counts = [];
  if (isKnown(data?.profile?.repos)) counts.push(plural(copy.repos, data.profile.repos, locale));
  if (isKnown(data?.profile?.followers)) counts.push(plural(copy.followers, data.profile.followers, locale));
  const summary = counts.join(' · ') || period;
  let subtitle = summary;
  if (active) {
    const date = dateFormatter.format(new Date(`${active.date}T00:00:00`));
    const forms = { 0: copy.day.none, 1: copy.day.one };
    subtitle = fill(forms[active.count] ?? copy.day.other, { n: numbers.format(active.count), date });
  }
  // Every text the subtitle line can show, minus the visible one: they only reserve its height.
  const subtitleProbes = [...new Set([summary, ...readoutProbes])].filter((text) => text && (!data || text !== subtitle));

  // "Atualizado às 20:09" like the WakaTime card (amber "Mostrando a leitura das…" when the refresh failed).
  const note = data
    ? freshnessNote(formatStamp(data.fetchedAt ?? savedAt, locale, today), status === 'stale' || data.stale, t)
    : null;

  const total =
    data?.totalContributions ?? (weeks ?? []).reduce((sum, week) => sum + week.days.reduce((s, day) => s + day.count, 0), 0);
  const profileUrl = data?.profile?.htmlUrl || GITHUB_PROFILE_URL;
  const loading = !data && status !== 'error';

  return (
    <article
      aria-labelledby={titleId}
      aria-busy={loading || undefined}
      className="flex h-full flex-col rounded-card bg-surface-2 p-card"
    >
      <header>
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <h3 id={titleId} className="text-title-3 text-label-1">
            {copy.title}
          </h3>
          {/* Under 360px the short label keeps the link beside the title; the full name stays in aria-label. */}
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${copy.viewOnGithub} (${t.ui.opensInNewTab})`}
            className="text-link -my-2 shrink-0"
          >
            <span className="max-[359px]:hidden">{copy.viewOnGithub}</span>
            <span className="hidden max-[359px]:inline">{copy.viewOnGithubShort}</span>
            <span aria-hidden="true" className="text-[1.1em] leading-none">
              ↗
            </span>
          </a>
        </div>
        {(data || loading) && (
          <div className="mt-1 grid grid-cols-1 text-footnote tabular-nums text-label-2">
            {data ? (
              <p aria-live="polite" className="[grid-area:1/1]">
                {subtitle}
              </p>
            ) : (
              <span aria-hidden="true" className="skeleton mt-px block h-4 w-48 max-w-full rounded-pill [grid-area:1/1]" />
            )}
            {subtitleProbes.map((text) => (
              <p key={text} aria-hidden="true" className="invisible [grid-area:1/1]">
                {text}
              </p>
            ))}
          </div>
        )}
      </header>

      {data && (
        <>
          <div className="mt-5 flex gap-2 [--cell:12px] lg:mt-auto lg:pt-6 lg:[--cell:10px]">
            <div
              aria-hidden="true"
              className="flex shrink-0 flex-col gap-[3px] pt-[1.375rem] text-caption leading-none text-label-2"
            >
              {weekdayLabels.map((label, weekday) => (
                <span key={weekday} className="flex h-[var(--cell)] items-center">
                  {label}
                </span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              <div
                ref={scrollerRef}
                role="img"
                aria-label={fill(copy.calendarLabel, { n: numbers.format(total) })}
                tabIndex={0}
                onScroll={measure}
                className="overflow-x-auto overscroll-x-contain rounded-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="w-max">
                  <div aria-hidden="true" className="relative mb-1.5 h-4 text-caption leading-4 text-label-2">
                    {monthLabels.map((label) => (
                      <span
                        key={label.index}
                        data-month={label.index}
                        className={`absolute top-0 whitespace-nowrap transition-opacity duration-fast ease-standard ${
                          hiddenMonths.has(String(label.index)) ? 'opacity-0' : ''
                        }`}
                        style={{ left: `calc(${label.index} * (var(--cell) + 3px))` }}
                      >
                        {label.text}
                      </span>
                    ))}
                  </div>

                  <div
                    className="flex touch-manipulation gap-[3px] [-webkit-tap-highlight-color:transparent]"
                    onClick={onPick}
                    onPointerOver={onHover}
                    onPointerLeave={clearHover}
                  >
                    {columns.map((column, columnIndex) => (
                      <div key={columnIndex} className="flex flex-col gap-[3px]">
                        {column.map((day, weekday) =>
                          day ? (
                            <span
                              key={weekday}
                              data-date={day.date}
                              data-count={day.count}
                              className={`block size-[var(--cell)] rounded-[3px] ${LEVELS[levelOf(day.count)]} ${
                                active?.date === day.date ? 'outline outline-2 outline-offset-1 outline-label-1' : ''
                              }`}
                            />
                          ) : (
                            <span key={weekday} className="block size-[var(--cell)]" />
                          ),
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <span
                ref={fadeRef}
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 -left-px w-7 bg-gradient-to-r from-surface-2 from-[15%] transition-opacity duration-fast ease-standard ${
                  edges.start ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 -right-px w-7 bg-gradient-to-l from-surface-2 from-[15%] transition-opacity duration-fast ease-standard ${
                  edges.end ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </div>

          <div aria-hidden="true" className="mt-3 flex items-center justify-end gap-1 text-caption text-label-2">
            <span className="mr-1">{copy.less}</span>
            {LEVELS.map((level) => (
              <span key={level} className={`size-2.5 rounded-[2px] ${level}`} />
            ))}
            <span className="ml-1">{copy.more}</span>
          </div>

          {note && (
            <StatusNote tone={note.tone} className="mt-4">
              {note.text}
            </StatusNote>
          )}
        </>
      )}

      {loading && (
        <div aria-hidden="true" className="mt-5 lg:mt-auto lg:pt-6">
          <span className="skeleton block h-[7.75rem] w-full rounded-control lg:h-[6.875rem]" />
          <span className="skeleton ml-auto mt-3 block h-4 w-36 rounded-pill" />
          <span className="skeleton mt-4 block h-4 w-40 rounded-pill" />
        </div>
      )}

      {!data && status === 'error' && <ErrorBlock onRetry={retry} className="my-auto pt-4" />}
    </article>
  );
}
