import { HttpError, fetchJson } from '../lib/http';
import { useResource } from '../lib/resource';

// Astronomy Picture of the Day through our own bridge (/nasa.php keeps the API key, the cache and the PT
// translation on the server). When the bridge can't answer (out of quota, misconfigured, down or unreachable), the
// browser asks NASA itself, as the site always did. Accepts the bridge's { data } envelope and NASA's raw shape.
export const APOD_FIRST_DATE = '1995-06-16';

const HOUR = 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NASA_APOD_URL = 'https://api.nasa.gov/planetary/apod';
// Bridge failures worth a direct try. INVALID_PARAM (a day missing from NASA's archive) is NASA's own answer.
const FALLBACK_CODES = new Set(['RATE_LIMITED', 'UPSTREAM', 'NOT_CONFIGURED', 'TIMEOUT', 'NETWORK', 'INVALID_RESPONSE']);
const LATER = 30 * 60; // seconds: a longer wait is announced as "later", never as a clock time hours away

export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// APOD follows US Eastern time: in the Brazilian evening it is still "yesterday" for NASA.
export function apodToday() {
  const now = new Date();
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .formatToParts(now)
        .map(({ type, value }) => [type, value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function apodPageUrl(date) {
  return isValidIsoDate(date)
    ? `https://apod.nasa.gov/apod/ap${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8, 10)}.html`
    : 'https://apod.nasa.gov/apod/astropix.html';
}

function httpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim(), 'https://apod.nasa.gov/apod/');
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

const cleanText = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');

export function normalizeApod(body) {
  const raw = body?.data && typeof body.data === 'object' ? body.data : (body ?? {});
  const mediaType = raw.mediaType ?? raw.media_type;
  const url = httpsUrl(raw.url);

  return {
    date: cleanText(raw.date),
    title: cleanText(raw.title),
    explanation: cleanText(raw.explanation),
    // Like the bridge: a photo or video without a usable https address is shown as "other media".
    mediaType: (mediaType === 'image' || mediaType === 'video') && url ? mediaType : 'other',
    url,
    hdUrl: httpsUrl(raw.hdUrl ?? raw.hdurl),
    thumbnailUrl: httpsUrl(raw.thumbnailUrl ?? raw.thumbnail_url),
    copyright: cleanText(raw.copyright),
    translated: raw.translated === true,
  };
}

// Never render a half-empty answer ("undefined", empty title, image without a source): treat it as an error.
const isApod = (apod) =>
  Boolean(apod?.title && isValidIsoDate(apod.date) && (apod.mediaType === 'other' || apod.url));

function toApod(body) {
  const apod = normalizeApod(body);
  if (!isApod(apod)) throw new HttpError('Invalid APOD', { code: 'INVALID_RESPONSE' });
  return apod;
}

// Straight from the browser with DEMO_KEY, so each visitor uses the quota of their own IP (what the site did before
// the bridge). English text, marked untranslated: the PT page then says it is NASA's original text. Today (also a
// date that is still today in New York) = NASA's current picture: like the bridge, NASA itself serves the previous
// day until the new one is published.
function loadFromNasa(date) {
  const params = new URLSearchParams({ api_key: 'DEMO_KEY', thumbs: 'true' });
  const pastDay = Boolean(date) && date !== apodToday();
  if (pastDay) params.set('date', date);

  return fetchJson(`${NASA_APOD_URL}?${params}`, { timeout: 10000 }).then(
    (body) => ({ ...toApod(body), translated: false }),
    (error) => {
      // 400/404 for a past day: a gap in NASA's archive (the bridge answers INVALID_PARAM for it too).
      if (pastDay && (error?.status === 400 || error?.status === 404)) {
        throw new HttpError('Not in the APOD archive', { status: 404, code: 'INVALID_PARAM' });
      }
      throw error;
    },
  );
}

// A rate-limited answer says how long to wait (retryAfter, seconds): keep the moment it ends (error.retryAt, ms) so
// the error state can say when to try again, or just "later" when that is more than 30 minutes away (retryLater).
// Done here, when the answer arrives, so rendering stays pure.
function withRetryAt(error) {
  const wait = Number(error?.retryAfter);
  if (error && Number.isFinite(wait) && wait > 0) {
    error.retryAt = Date.now() + wait * 1000;
    error.retryLater = wait > LATER;
  }
  return error;
}

// The bridge first (cached, translated); when it can't answer, NASA directly. If that fails too, the bridge's error
// is the one shown (it knows how long a rate limit lasts), unless NASA said the day is not in its archive.
async function loadApod(date, lang) {
  const query = new URLSearchParams(date ? { date, lang } : { lang });
  try {
    return toApod(await fetchJson(`/nasa.php?${query}`, { timeout: 12000 }));
  } catch (error) {
    if (!FALLBACK_CODES.has(error?.code)) throw withRetryAt(error);
    try {
      return await loadFromNasa(date);
    } catch (direct) {
      throw direct?.code === 'INVALID_PARAM' ? direct : withRetryAt(error);
    }
  }
}

// date '' = today (the bridge decides "today" in New York). Past dates never change, so they stay cached longer.
export function useApod({ date = '', lang = 'pt', enabled = true } = {}) {
  return useResource(`apod:${date || 'today'}:${lang}`, () => loadApod(date, lang), {
    ttl: date ? 24 * HOUR : HOUR / 2,
    enabled,
    validate: isApod,
  });
}
