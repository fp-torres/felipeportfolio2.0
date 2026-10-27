import { Icon } from '@iconify/react';
import { useLanguage } from '../context/useLanguage';
import { fetchJson } from '../lib/http';
import { useResource } from '../lib/resource';
import LabStatus from './lab/LabStatus';
import { NewsSkeleton } from './lab/LabSkeletons';
import { fill, localeOf } from './lab/text';

// Laboratório → "Radar tech": today's top DEV Community articles. DEV's API is public (no secret), so it is
// called directly; the shared in-memory cache keeps it to one request per half hour.
// Lazy-loaded by the Footer and rendered inside its <Sheet>, so it only mounts while the sheet is open.
const FEED_URL = 'https://dev.to/api/articles?tag=programming&top=1&per_page=10';
const MORE_URL = 'https://dev.to/t/programming/top/day';
const MINUTE = 60 * 1000;

function httpsUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

const cleanText = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');

function normalizeArticles(list) {
  if (!Array.isArray(list)) throw new Error('Unexpected DEV response');

  return list.flatMap((item) => {
    const url = httpsUrl(item?.url);
    const title = cleanText(item?.title);
    if (!url || !title) return [];
    let tags = [];
    if (Array.isArray(item.tag_list)) tags = item.tag_list;
    else if (typeof item.tag_list === 'string') tags = item.tag_list.split(',');
    const minutes = Number(item.reading_time_minutes);

    return [
      {
        id: item.id ?? url,
        url,
        title,
        author: cleanText(item.user?.name),
        avatar: httpsUrl(item.user?.profile_image_90),
        publishedAt: Date.parse(item.published_at) || 0,
        readingTime: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0,
        tags: tags.map(cleanText).filter(Boolean).slice(0, 2),
      },
    ];
  });
}

const loadArticles = () => fetchJson(FEED_URL, { timeout: 8000 }).then(normalizeArticles);

// Relative to the moment the list was fetched (keeps rendering pure).
function relativeTime(timestamp, fetchedAt, lang, justNow) {
  if (!timestamp || !fetchedAt) return '';
  const minutes = Math.round(Math.max(0, fetchedAt - timestamp) / MINUTE);
  if (minutes < 1) return justNow;
  const format = new Intl.RelativeTimeFormat(localeOf(lang), {
    numeric: 'auto',
    style: lang === 'en' ? 'narrow' : 'short',
  });
  if (minutes < 60) return format.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return format.format(-hours, 'hour');
  return format.format(-Math.round(hours / 24), 'day');
}

export default function TechNews() {
  const { t, lang } = useLanguage();
  const copy = t.footer.lab.news;
  const { data, status, retry, savedAt } = useResource('lab:devto-top', loadArticles, { ttl: 30 * MINUTE });

  const retryButton = (
    <button type="button" onClick={retry} className="btn-secondary">
      {t.ui.retry}
    </button>
  );

  if (!data) {
    if (status !== 'error') return <NewsSkeleton />;
    return (
      <LabStatus icon="solar:radar-2-linear" title={copy.errorTitle} text={copy.errorText}>
        {retryButton}
      </LabStatus>
    );
  }

  if (data.length === 0) {
    return (
      <LabStatus icon="solar:radar-2-linear" title={copy.emptyTitle} text={copy.emptyText}>
        {retryButton}
      </LabStatus>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        {data.map((article) => (
          <li key={article.id} className="flex min-w-0 sm:[&:nth-child(odd):last-child]:col-span-2">
            <ArticleTile
              article={article}
              when={relativeTime(article.publishedAt, savedAt, lang, copy.justNow)}
              copy={copy}
              newTab={t.ui.opensInNewTab}
            />
          </li>
        ))}
      </ul>

      <a href={MORE_URL} target="_blank" rel="noopener noreferrer" className="text-link mt-3">
        {copy.more}
        <span aria-hidden="true">↗</span>
        <span className="sr-only">({t.ui.opensInNewTab})</span>
      </a>
    </div>
  );
}

function ArticleTile({ article, when, copy, newTab }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full min-w-0 flex-col gap-2 rounded-tile bg-surface-2 p-4 transition-[background-color,transform] duration-fast ease-standard hover:bg-surface-3 active:scale-[0.985] active:bg-surface-3"
    >
      <div className="flex min-h-5 items-center justify-between gap-3">
        <p className="min-w-0 truncate font-mono text-caption text-label-2">
          {article.tags.map((tag) => `#${tag}`).join(' ')}
        </p>
        <Icon icon="solar:arrow-right-up-linear" className="size-4 shrink-0 text-label-2" aria-hidden="true" />
      </div>

      <h3 className="line-clamp-3 break-words text-callout font-semibold text-label-1">{article.title}</h3>

      <div className="mt-auto flex min-w-0 items-center gap-2 pt-1 text-footnote text-label-2">
        {article.avatar && (
          <img
            src={article.avatar}
            alt=""
            width="20"
            height="20"
            loading="lazy"
            decoding="async"
            className="size-5 shrink-0 rounded-full bg-white/10 object-cover"
          />
        )}
        <p className="flex min-w-0 items-center gap-1.5">
          {article.author && <span className="min-w-0 truncate">{article.author}</span>}
          {article.author && (when || article.readingTime > 0) && <Dot />}
          {when && <span className="shrink-0 tabular-nums">{when}</span>}
          {when && article.readingTime > 0 && <Dot />}
          {article.readingTime > 0 && (
            <span className="shrink-0 tabular-nums">
              <span aria-hidden="true">{fill(copy.readingShort, { n: article.readingTime })}</span>
              <span className="sr-only">{fill(copy.readingTime, { n: article.readingTime })}</span>
            </span>
          )}
        </p>
      </div>
      <span className="sr-only">({newTab})</span>
    </a>
  );
}

// Visual separator; screen readers get a pause instead of "dot".
function Dot() {
  return (
    <>
      <span aria-hidden="true" className="shrink-0">
        ·
      </span>
      <span className="sr-only">, </span>
    </>
  );
}
