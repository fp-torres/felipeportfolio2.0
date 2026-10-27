import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { apodPageUrl } from '../../hooks/useApod';
import LabStatus from './LabStatus';
import { ApodSkeleton } from './LabSkeletons';
import { fill, localeOf } from './text';

// One Astronomy Picture of the Day (NASA hoje + Máquina do tempo): media on a black stage, mono "lab" eyebrow,
// title, date, explanation. resource = the object returned by useApod().
// Media is absolutely positioned so object-contain works inside the capped box (landscape phones included).
const STAGE =
  'relative grid aspect-[4/3] max-h-[min(60dvh,34rem)] w-full place-items-center overflow-hidden rounded-tile bg-bg sm:aspect-[16/10] [@media(max-height:500px)]:max-h-[45dvh]';
const MEDIA = 'absolute inset-0 size-full';
const ARCHIVE_URL = 'https://apod.nasa.gov/apod/archivepix.html';

export default function ApodView({ resource, date = '' }) {
  const { data, status, error, retry } = resource;

  if (data) return <ApodArticle key={`${data.date}|${data.url}`} apod={data} />;
  if (status === 'error') return <ApodError error={error} onRetry={retry} date={date} />;
  return <ApodSkeleton />;
}

function ApodArticle({ apod }) {
  const { t, lang } = useLanguage();
  const copy = t.footer.lab.apod;
  // Mark untranslated NASA text as English so screen readers pronounce it correctly on the PT page.
  const textLang = lang === 'pt' && !apod.translated ? 'en' : undefined;
  const note = lang === 'pt' ? (apod.translated ? copy.translated : copy.original) : '';
  let mediaLink = null;
  if (apod.mediaType === 'image') mediaLink = { href: apod.hdUrl || apod.url, label: copy.viewHd };
  else if (apod.mediaType === 'video' && apod.url) mediaLink = { href: apod.url, label: copy.openVideo };

  return (
    <article>
      <ApodMedia apod={apod} copy={copy} />

      <div className="mt-5 max-w-reading">
        <p className="font-mono text-footnote text-label-2">{fill(copy.eyebrow, { date: apod.date })}</p>
        <h3 lang={textLang} className="mt-2 break-words text-title-2 text-label-1">
          {apod.title}
        </h3>
        <p className="meta mt-2">
          <time dateTime={apod.date}>{longDate(apod.date, lang)}</time>
          {apod.copyright && (
            <>
              <span aria-hidden="true"> · </span>
              {fill(copy.credit, { name: apod.copyright })}
            </>
          )}
        </p>
        {apod.explanation && (
          <p lang={textLang} className="mt-4 break-words text-body text-label-2">
            {apod.explanation}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-6">
          {mediaLink && <ExternalLink href={mediaLink.href}>{mediaLink.label}</ExternalLink>}
          <ExternalLink href={apodPageUrl(apod.date)}>{copy.openOnNasa}</ExternalLink>
        </div>
        {note && <p className="mt-1 text-footnote text-label-2">{note}</p>}
      </div>
    </article>
  );
}

function ApodMedia({ apod, copy }) {
  // 'loading' | 'loaded' | 'failed' — for the photo or the video thumbnail.
  const [imageState, setImageState] = useState('loading');
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef(null);

  // The play button disappears when the player loads: keep keyboard focus on the player itself.
  useEffect(() => {
    if (playing) playerRef.current?.focus();
  }, [playing]);

  if (apod.mediaType === 'image') {
    return (
      <div className={STAGE}>
        {imageState === 'failed' ? (
          <MediaNote icon="solar:gallery-linear" text={copy.imageError} />
        ) : (
          <>
            {imageState === 'loading' && (
              <div aria-hidden="true" className="absolute inset-0 bg-white/[0.06] motion-safe:animate-pulse" />
            )}
            <img
              src={apod.url}
              alt={apod.title}
              decoding="async"
              onLoad={() => setImageState('loaded')}
              onError={() => setImageState('failed')}
              className={`${MEDIA} object-contain transition-opacity duration-slow ease-standard ${
                imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        )}
      </div>
    );
  }

  if (apod.mediaType === 'video' && apod.url) {
    if (isVideoFile(apod.url)) {
      return (
        <div className={STAGE}>
          <video
            src={apod.url}
            poster={apod.thumbnailUrl || undefined}
            controls
            playsInline
            preload="metadata"
            aria-label={apod.title}
            className={MEDIA}
          />
        </div>
      );
    }

    // Light facade: the heavy player only loads when the visitor asks for it.
    if (!playing && apod.thumbnailUrl && imageState !== 'failed') {
      return (
        <div className={STAGE}>
          <img
            src={apod.thumbnailUrl}
            alt=""
            decoding="async"
            onError={() => setImageState('failed')}
            className={`${MEDIA} object-cover`}
          />
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${copy.playVideo}: ${apod.title}`}
            className="group absolute inset-0 grid place-items-center"
          >
            <span className="grid size-14 place-items-center rounded-full bg-bg/60 text-label-1 ring-1 ring-white/20 transition-[background-color,transform] duration-fast ease-standard group-hover:bg-bg/75 group-active:scale-95">
              <Icon icon="solar:play-linear" className="size-6 translate-x-px" aria-hidden="true" />
            </span>
          </button>
        </div>
      );
    }

    return (
      <div className={STAGE}>
        <iframe
          ref={playerRef}
          src={playing ? withAutoplay(apod.url) : apod.url}
          title={apod.title}
          loading="lazy"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          className={`${MEDIA} border-0`}
        />
      </div>
    );
  }

  return (
    <div className={STAGE}>
      <MediaNote icon="solar:stars-linear" text={copy.otherMedia} />
    </div>
  );
}

function MediaNote({ icon, text }) {
  return (
    <div className="flex flex-col items-center gap-2 p-6 text-center">
      <Icon icon={icon} className="size-7 text-label-2" aria-hidden="true" />
      <p className="max-w-[22rem] text-callout text-label-2">{text}</p>
    </div>
  );
}

function ApodError({ error, onRetry, date }) {
  const { t, lang } = useLanguage();
  const copy = t.footer.lab.apod;
  const invalidDate = error?.code === 'INVALID_PARAM' || error?.status === 400;
  const rateLimited = error?.code === 'RATE_LIMITED' || error?.status === 429;
  let text = copy.unavailable;
  if (invalidDate) text = copy.invalidDate;
  else if (rateLimited) {
    // "Tente de novo a partir das 20:24" when the bridge said how long to wait (useApod sets retryAt); only
    // "mais tarde" when that is more than 30 minutes away (retryLater), so it never reads like a near promise.
    if (error.retryLater) text = copy.rateLimitedLater;
    else if (Number.isFinite(error.retryAt)) text = fill(copy.rateLimitedUntil, { time: clockTime(error.retryAt, lang) });
    else text = copy.rateLimited;
  }

  return (
    <LabStatus icon="solar:planet-linear" title={copy.errorTitle} text={text}>
      {!invalidDate && (
        <button type="button" onClick={onRetry} className="btn-secondary">
          {t.ui.retry}
        </button>
      )}
      <ExternalLink href={invalidDate ? ARCHIVE_URL : apodPageUrl(date)}>{copy.openOnNasa}</ExternalLink>
    </LabStatus>
  );
}

function ExternalLink({ href, children }) {
  const { t } = useLanguage();

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-link">
      {children}
      <span aria-hidden="true">↗</span>
      <span className="sr-only">({t.ui.opensInNewTab})</span>
    </a>
  );
}

// 20:24 (pt) · 8:24 PM (en), in the visitor's own time zone.
function clockTime(timestamp, lang) {
  return new Intl.DateTimeFormat(localeOf(lang), {
    hour: lang === 'en' ? 'numeric' : '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function longDate(isoDate, lang) {
  try {
    return new Intl.DateTimeFormat(localeOf(lang), { dateStyle: 'long', timeZone: 'UTC' }).format(
      new Date(`${isoDate}T00:00:00Z`),
    );
  } catch {
    return isoDate;
  }
}

function isVideoFile(url) {
  try {
    return /\.(mp4|webm|m4v|mov)$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function withAutoplay(url) {
  try {
    const next = new URL(url);
    next.searchParams.set('autoplay', '1');
    return next.href;
  } catch {
    return url;
  }
}
