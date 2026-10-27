import { Icon } from '@iconify/react';
import { useLanguage } from '../context/useLanguage';
import { NEWS_MORE_URL, useTechNews } from '../hooks/useTechNews';
import LabStatus from './lab/LabStatus';
import { NewsSkeleton } from './lab/LabSkeletons';
import { fill, localeOf } from './lab/text';

// Laboratório → "Radar tech": today's top DEV Community articles, through our bridge (titles translated for the
// Portuguese page) or straight from DEV when the bridge can't answer — see src/hooks/useTechNews.js.
// Lazy-loaded by the Footer and rendered inside its <Sheet>, so it only mounts while the sheet is open.
const MINUTE = 60 * 1000;

// 'pt-BR' → 'pt'
const baseLang = (tag) => String(tag).split('-')[0].toLowerCase();

// Portuguese page only: says whether the titles were machine-translated, are still in English, or a mix of both.
function translationNote(articles, lang, copy) {
  if (lang !== 'pt') return '';
  const translated = articles.some((article) => article.translated);
  const original = articles.some((article) => baseLang(article.lang) !== 'pt');
  if (translated && original) return copy.partial;
  if (translated) return copy.translated;
  return original ? copy.original : '';
}

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
  const { data, status, error, retry, savedAt } = useTechNews(lang);

  const retryButton = (
    <button type="button" onClick={retry} className="btn-secondary">
      {t.ui.retry}
    </button>
  );

  // 'error' never comes with this language's own data: what useResource lends meanwhile is the other language's list,
  // which would stay on screen (in the wrong language) instead of the retry button — or, while that retry runs
  // ('loading' with the error kept), instead of the skeleton.
  if (!data || status === 'error' || (status === 'loading' && error)) {
    if (status !== 'error') return <NewsSkeleton />;
    return (
      <LabStatus icon="solar:radar-2-linear" title={copy.errorTitle} text={copy.errorText}>
        {retryButton}
      </LabStatus>
    );
  }

  const { articles } = data;
  // Lists saved before loadedAt existed fall back to the moment they were cached.
  const fetchedAt = data.loadedAt ?? savedAt;
  if (articles.length === 0) {
    return (
      <LabStatus icon="solar:radar-2-linear" title={copy.emptyTitle} text={copy.emptyText}>
        {retryButton}
      </LabStatus>
    );
  }

  // 'loading' with data = the other language's list, shown while this one arrives: its note would be wrong.
  const note = status === 'loading' ? '' : translationNote(articles, lang, copy);

  return (
    <div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        {articles.map((article) => (
          <li key={article.id} className="flex min-w-0 sm:[&:nth-child(odd):last-child]:col-span-2">
            <ArticleTile
              article={article}
              lang={lang}
              when={relativeTime(article.publishedAt, fetchedAt, lang, copy.justNow)}
              copy={copy}
              newTab={t.ui.opensInNewTab}
            />
          </li>
        ))}
      </ul>

      <a href={NEWS_MORE_URL} target="_blank" rel="noopener noreferrer" className="text-link mt-3">
        {copy.more}
        <span aria-hidden="true">↗</span>
        <span className="sr-only">({t.ui.opensInNewTab})</span>
      </a>
      {note && <p className="mt-1 text-footnote text-label-2">{note}</p>}
    </div>
  );
}

function ArticleTile({ article, lang, when, copy, newTab }) {
  // A title still in another language is marked as such, so screen readers pronounce it correctly.
  const textLang = baseLang(article.lang) === lang ? undefined : article.lang;

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

      <h3 lang={textLang} className="line-clamp-3 break-words text-callout font-semibold text-label-1">
        {article.title}
      </h3>

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
