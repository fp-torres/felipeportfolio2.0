import { HttpError, fetchJson } from '../lib/http';
import { useResource } from '../lib/resource';
import { translateLines } from '../lib/translate';

// "Radar tech": today's top DEV Community articles through our bridge (/news.php keeps one copy for every visitor and
// serves the Portuguese page with the titles translated). When the bridge can't answer (down, or local dev without
// PHP), the browser reads DEV's public API itself — it allows any origin — with the same rules as the bridge (see
// public/news.php). On the Portuguese page, English titles left by either path are translated here
// (src/lib/translate.js); if that fails too, the original titles are shown, marked untranslated, and the page says so.
// Every language has its own cached copy; switching back and forth reuses it.
export const NEWS_MORE_URL = 'https://dev.to/t/programming/top/day';
const FEED_URL = 'https://dev.to/api/articles?tag=programming&top=1&per_page=10';
const MINUTE = 60 * 1000;
// Bridge failures worth a direct try. INVALID_PARAM is a bug, not an outage.
const FALLBACK_CODES = new Set([
  'RATE_LIMITED',
  'UPSTREAM',
  'NOT_CONFIGURED',
  'TIMEOUT',
  'NETWORK',
  'INVALID_RESPONSE',
]);
const LANGUAGE_TAG = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/; // like news_language(): "EN" is not a code DEV uses
const TAG = /^[\p{L}\p{N}_-]{1,30}$/u;
// The named entities DEV actually uses (the bridge decodes every HTML5 one).
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘',
  rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™', middot: '·', bull: '•',
};
const TITLE_MAX = 250;

// 'pt-BR' → 'pt'
const baseLang = (tag) => String(tag).split('-')[0].toLowerCase();

// Like the bridge's filter_var(): spaces or characters outside printable ASCII make the address invalid.
function httpsUrl(value) {
  if (typeof value !== 'string' || /[^\x21-\x7e]/.test(value)) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

// Whitespace of any kind and control characters → one space; zero-width and bidi characters out (like the bridge).
const cleanText = (value) =>
  typeof value === 'string'
    ? value
        .replace(/[\u200B\uFEFF\u202A-\u202E\u2066-\u2069]/g, '')
        .replace(/[\s\p{Cc}]+/gu, ' ')
        .trim()
    : '';

// At most `max` characters (+ "…"), cut at a word when one ends near the limit — the bridge's news_clip.
function clip(text, max) {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  let cut = chars.slice(0, max).join('');
  const space = cut.lastIndexOf(' ');
  if (space > cut.length * 0.7) cut = cut.slice(0, space);
  return `${cut.replace(/[ .,;:]+$/, '')}…`;
}

// DEV escapes some descriptions ("Q&amp;A", "&lt;div&gt;"): decoded once, like the bridge. Never parsed as HTML —
// "ReadonlyDeep<T>" in a title is text.
function decodeEntities(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/&(#\d{1,7}|#x[\da-f]{1,6}|[a-z]+);/gi, (match, name) => {
    if (name[0] !== '#') return NAMED_ENTITIES[name.toLowerCase()] ?? match;
    const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    // Like html_entity_decode(): no lone surrogate, no control character (tab and line breaks aside).
    const control = (code < 0x20 && ![9, 10, 13].includes(code)) || (code >= 0x7f && code <= 0x9f);
    const valid = code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff) && !control;
    return valid ? String.fromCodePoint(code) : match;
  });
}

// One shape for both sources: { id, url, title, author, avatar, publishedAt (ms), readingTime (0 = unknown),
// tags (≤ 2), lang (language of the text as shown), translated }.
function toArticle({ id, url, title, author, avatar, publishedAt, readingTime, tags, lang, translated }) {
  const href = httpsUrl(url);
  const text = clip(cleanText(title), TITLE_MAX);
  if (!href || !text) return [];
  let tagList = [];
  if (Array.isArray(tags)) tagList = tags;
  else if (typeof tags === 'string') tagList = tags.split(',');
  // Like the bridge's is_numeric(): a number, or a string of digits ("7" — not "0x1A").
  const numeric =
    typeof readingTime === 'number' || (typeof readingTime === 'string' && /^\s*\d+(?:\.\d+)?\s*$/.test(readingTime));
  const minutes = numeric ? Number(readingTime) : NaN;

  return [
    {
      id: typeof id === 'number' || typeof id === 'string' ? id : href,
      url: href,
      title: text,
      author: clip(cleanText(author), 80),
      avatar: httpsUrl(avatar),
      publishedAt: Date.parse(publishedAt) || 0,
      readingTime: Number.isFinite(minutes) && minutes >= 1 && minutes <= 600 ? Math.round(minutes) : 0,
      tags: [
        ...new Set(
          tagList
            .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
            .filter((tag) => TAG.test(tag)),
        ),
      ].slice(0, 2),
      lang: typeof lang === 'string' && LANGUAGE_TAG.test(lang) ? lang : 'en',
      translated: translated === true,
    },
  ];
}

function uniqueArticles(list) {
  const seen = new Set();
  return list.filter((article) => !seen.has(article.id) && seen.add(article.id));
}

// The bridge's { data: { articles } } envelope (fields already clean). Anything else — e.g. the page served by a
// static host that has no PHP — counts as "the bridge can't answer".
function fromBridge(body) {
  const articles = body?.data?.articles;
  if (!Array.isArray(articles)) throw new HttpError('Unexpected /news.php response', { code: 'INVALID_RESPONSE' });
  return uniqueArticles(articles.flatMap((item) => toArticle(item ?? {})));
}

// DEV's own list, as the bridge would normalize it, in its original language.
function fromDev(list) {
  if (!Array.isArray(list)) throw new Error('Unexpected DEV response');
  const articles = list.flatMap((item) =>
    toArticle({
      id: item?.id,
      url: item?.url,
      title: decodeEntities(item?.title),
      author: cleanText(decodeEntities(item?.user?.name)) || decodeEntities(item?.user?.username),
      avatar: item?.user?.profile_image_90,
      publishedAt: item?.published_at,
      readingTime: item?.reading_time_minutes,
      tags: item?.tag_list ?? item?.tags,
      lang: item?.language,
      translated: false,
    }),
  );
  return uniqueArticles(articles);
}

// The Portuguese page with English titles left — read from DEV directly, or served untranslated by the bridge while
// its translator is failing (the visitor's browser isn't rate-limited with the server): those titles translated here,
// in one request, with the bridge's technical terms kept as written. Others, and every title when the translator
// fails too, keep their language.
async function toPortuguese(articles) {
  const english = articles.filter((article) => baseLang(article.lang) === 'en');
  const titles = await translateLines(
    english.map((article) => article.title),
    { keepTerms: true, timeout: 5000 },
  );
  if (!titles) return articles;
  const translated = new Map(english.map((article, index) => [article.id, clip(titles[index], TITLE_MAX)]));
  return articles.map((article) =>
    translated.has(article.id)
      ? { ...article, title: translated.get(article.id), lang: 'pt', translated: true }
      : article,
  );
}

// The bridge first (shared cache, Portuguese titles); when it can't answer, DEV directly. If that fails too, the
// bridge's error is the one kept. loadedAt: when the list was fetched, the reference of its relative times.
async function loadNews(lang) {
  let articles;
  try {
    articles = fromBridge(await fetchJson(`/news.php?lang=${lang}`, { timeout: 12000 }));
  } catch (error) {
    if (!FALLBACK_CODES.has(error?.code)) throw error;
    try {
      articles = fromDev(await fetchJson(FEED_URL, { timeout: 8000 }));
    } catch {
      throw error;
    }
  }
  if (lang === 'pt') articles = await toPortuguese(articles);
  return { articles, loadedAt: Date.now() };
}

const isNews = (data) => Array.isArray(data?.articles);

export function useTechNews(lang) {
  const language = lang === 'en' ? 'en' : 'pt';
  // group: while the other language loads, the list on screen stays instead of flashing the skeleton.
  // Portuguese is checked again sooner: a list served in English while the translator was failing doesn't stay for
  // half an hour (a translated answer is still served by the browser's HTTP cache, max-age 15 min).
  return useResource(`lab:news:${language}`, () => loadNews(language), {
    ttl: language === 'pt' ? 5 * MINUTE : 30 * MINUTE,
    group: 'lab:news',
    validate: isNews,
  });
}
