import { HttpError, fetchJson } from '../lib/http';
import { useResource } from '../lib/resource';
import { translateLines } from '../lib/translate';

// Astronomy Picture of the Day through our own bridge (/nasa.php keeps the cache and the PT translation on the
// server). When the bridge can't answer (down, unreachable, out of quota), the browser reads NASA Science itself —
// its public API allows any origin — with the same rules as the bridge (see public/nasa.php), within one deadline,
// and translates the Portuguese page's text itself (src/lib/translate.js), as it does when the bridge answers in
// English because its own translator is failing. Accepts the bridge's { data } envelope.
export const APOD_FIRST_DATE = '1995-06-16';
export const APOD_ARCHIVE_URL = 'https://science.nasa.gov/apod/archive/';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const APOD_HOME_URL = 'https://science.nasa.gov/apod/';
// One post per picture, titled "APOD: 2026 October 2 – Title" (apod.nasa.gov now redirects to science.nasa.gov).
const POSTS_URL = 'https://science.nasa.gov/wp-json/wp/v2/image-article';
const POST_FIELDS = 'id,date,link,title,content,_links,_embedded';
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
// Bridge failures worth a direct try. NOT_FOUND (no picture that day) and INVALID_PARAM are final answers.
const FALLBACK_CODES = new Set(['RATE_LIMITED', 'UPSTREAM', 'NOT_CONFIGURED', 'TIMEOUT', 'NETWORK', 'INVALID_RESPONSE']);
const LATER = 30 * 60; // seconds: a longer wait is announced as "later", never as a clock time hours away
// The whole direct read, translation included, after the bridge's 12 s: then the error state, not an endless skeleton.
const NASA_DEADLINE = 10000; // ms
const TRANSLATE_MIN = 1500; // ms: with less time left, NASA's English text is shown untranslated
// NASA's generic images (the NASA logo and "meatball", the stock art under /images/misc/ that posts without a picture
// carry — "news-thumbnail.png" —, theme files) and the titles of its landing page, which api.nasa.gov returned for
// every day once apod.nasa.gov redirected there: never shown as a picture of the day (an answer cached before the
// switch may still hold them).
const PLACEHOLDER_URL = /nasa[-_]?logo|meatball|news-thumbnail|\/images\/misc\/|\/wp-content\/themes\//i;
const PLACEHOLDER_TITLE = /^(?:apod\s*[-–:]\s*)?(?:nasa science|ciência da nasa|astronomy picture of the day|apod)$/i;
// APOD's own folder on NASA's asset server: a featured image anywhere else never stands for the picture on its own
// (as a video's poster, or for a post without the usual media block).
const OWN_IMAGE = /\/science\/cds\/apod\//i;
// The breadcrumb of NASA's APOD section ("Science › APOD › …"), on every APOD post: tells one whose title has no
// "APOD:" (1995-12-19, "Albert Einstein: 1879 – 1955") from NASA's other image articles.
const APOD_SECTION = /\/apod\/apod-index\/"[^>]*>\s*<span>\s*APOD\s*<\/span>/i;
// The day in a post's title: "2026 October 28", "29 October 2026" (NASA's form since 2026-10-29) or "October 29, 2026".
const TITLE_DATE = new RegExp(
  String.raw`^APOD:\s*(?:(?<y1>\d{4})\s+(?<m1>[a-z]{3,})\.?\s+(?<d1>\d{1,2})` +
    String.raw`|(?<d2>\d{1,2})\s+(?<m2>[a-z]{3,})\.?,?\s+(?<y2>\d{4})` +
    String.raw`|(?<m3>[a-z]{3,})\.?\s+(?<d3>\d{1,2}),?\s+(?<y3>\d{4}))` +
    String.raw`(?:\s*[–—:-]\s*|\s+)(?<title>.+)$`,
  'i',
);
// What a title naming no day starts with: "APOD: 2026 April –", "APOD: October 2026 –".
const NO_DAY_PREFIX = new RegExp(
  String.raw`^APOD:\s*(?:(?:\d{4}\s+[a-z]{3,}\.?(?:\s+\d{1,2})?` +
    String.raw`|(?:\d{1,2}\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s+\d{1,2})?,?\s+\d{4})` +
    String.raw`\s*[–—-]\s*)?`,
  'i',
);
// The label before the names: "Image Credit & Copyright:", "Credit and Copyright:", "Video Credit:", a bare "Credit".
const CREDIT_LABEL = /^(?:[a-z &]*(?:credit|copyright)[a-z &]*:\s*|credit\s+)+/i;
const VIDEO_FILE = /\.(?:mp4|webm|m4v|mov)$/i; // what ApodView plays in a <video> element
const IMAGE_FILE = /\.(?:jpe?g|png|gif|webp|avif|tiff?)$/i;
const YOUTUBE = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|watch\?(?:\S*?&)?v=)|youtu\.be\/)([\w-]{11})/i;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;

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

// NASA's pages no longer have an address per date (each answer brings its post as `link`): the archive for a day
// of the Time Machine, the APOD home for the latest picture.
export function apodPageUrl(date) {
  return isValidIsoDate(date) ? APOD_ARCHIVE_URL : APOD_HOME_URL;
}

// Absolute https URL ('' when unusable). Like the bridge: nothing on apod.nasa.gov (every address there now redirects
// to a generic page) and none of NASA's placeholder images.
function httpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim(), 'https://science.nasa.gov/');
    if (url.protocol === 'http:') url.protocol = 'https:';
    if (url.protocol !== 'https:' || url.hostname === 'apod.nasa.gov' || PLACEHOLDER_URL.test(url.pathname)) return '';
    return url.href;
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
    link: httpsUrl(raw.link), // the post on NASA's site
    translated: raw.translated === true,
  };
}

// Never render a half-empty answer ("undefined", empty title, image without a source): treat it as an error.
const isApod = (apod) =>
  Boolean(apod?.title && isValidIsoDate(apod.date) && (apod.mediaType === 'other' || apod.url));

// NASA's landing page in place of a picture (see PLACEHOLDER_*), or a photo/video whose address can't be used.
function isPlaceholder(raw) {
  const mediaType = raw.mediaType ?? raw.media_type;
  const urls = [raw.url, raw.hdUrl, raw.hdurl, raw.thumbnailUrl, raw.thumbnail_url];
  return (
    PLACEHOLDER_TITLE.test(cleanText(raw.title)) ||
    urls.some((value) => typeof value === 'string' && PLACEHOLDER_URL.test(value)) ||
    ((mediaType === 'image' || mediaType === 'video') && !httpsUrl(raw.url))
  );
}

function toApod(body) {
  const raw = body?.data && typeof body.data === 'object' ? body.data : (body ?? {});
  const apod = normalizeApod(raw);
  if (!isApod(apod) || isPlaceholder(raw)) throw new HttpError('Invalid APOD', { code: 'INVALID_RESPONSE' });
  return apod;
}

// ---------------------------------------------------------------------------------------------------------------
// NASA Science posts → the bridge's payload (same steps as public/nasa.php)

// Decodes the entities (&#8211; &amp; &nbsp;…) of tag-free text. DOMParser builds an inert document: nothing in it
// runs or loads. Browser only, like these loaders (they never run while pre-rendering).
function decodeEntities(text) {
  return text.includes('&') ? (new DOMParser().parseFromString(text, 'text/html').body.textContent ?? '') : text;
}

// Plain text of an HTML fragment: no tags, entities decoded, spaces tidied ("Hubble ( STScI )" → "Hubble (STScI)").
function plainText(html) {
  return decodeEntities(String(html).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .replace(/ ([,;!?)\]])/g, '$1')
    .replace(/ ([.:])(?= |$)/g, '$1')
    .replace(/([([]) /g, '$1')
    .trim();
}

// Decoded value of one attribute of an HTML tag ('' when absent).
function attr(tag, name) {
  const match = new RegExp(`\\s${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i').exec(tag);
  return match ? decodeEntities(match[2]).trim() : '';
}

function pathOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

const fileName = (url) => pathOf(url).split('/').pop().toLowerCase();

// { date, title } of a post titled "APOD: 2026 October 2 &#8211; Title" (old ones write the day as "01", a few have no
// dash: "APOD: 2017 November 22 ‘Oumuamua: …"), "APOD: 29 October 2026 – Title" (NASA's form since 2026-10-29) or
// "APOD: October 29, 2026 – Title"; null otherwise.
function titleParts(rendered) {
  const match = TITLE_DATE.exec(typeof rendered === 'string' ? plainText(rendered) : '');
  if (!match) return null;
  const { y1, y2, y3, m1, m2, m3, d1, d2, d3, title } = match.groups;
  const name = (m1 ?? m2 ?? m3).toLowerCase();
  const month = MONTHS.findIndex((monthName) => monthName.toLowerCase().startsWith(name)) + 1;
  const date = `${y1 ?? y2 ?? y3}-${String(month).padStart(2, '0')}-${(d1 ?? d2 ?? d3).padStart(2, '0')}`;
  return month && isValidIsoDate(date) ? { date, title: title.trim() } : null;
}

// The day a post is the picture of: the one its title names or, for an APOD post (titled "APOD:…", or in NASA's APOD
// section) whose title names no day in a known form, the day it was published — so a new way of writing the date
// never hides the latest picture again. '' when neither.
function postDay(post) {
  const named = titleParts(post?.title?.rendered)?.date;
  if (named) return named;
  const rendered = post?.title?.rendered;
  const content = post?.content?.rendered;
  const published = typeof post?.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(post.date);
  const apod =
    /^APOD\s*:/i.test(typeof rendered === 'string' ? plainText(rendered) : '') ||
    APOD_SECTION.test(typeof content === 'string' ? content : '');
  return published && apod ? post.date.slice(0, 10) : '';
}

// The post's featured image when it is a real picture, or null (missing or a placeholder). own: in APOD's own folder
// (OWN_IMAGE).
function featuredImage(post) {
  const media = post?._embedded?.['wp:featuredmedia']?.[0];
  const full = media?.media_type === 'image' ? httpsUrl(media.source_url) : '';
  if (!full || !fileName(full)) return null;
  // WordPress' lighter rendition (≈1280 px) for the page; the original stays as the high-resolution link.
  const sizes = media.media_details?.sizes ?? {};
  const light = ['large', 'medium_large', '1536x1536'].map((size) => httpsUrl(sizes[size]?.source_url)).find(Boolean);
  return { full, light: light ?? '', gif: media.mime_type === 'image/gif', own: OWN_IMAGE.test(pathOf(full)) };
}

// The page's <img> at most 1280 px wide or tall: NASA's image service (/dynamicimage/assets/science/…) resizes on
// request (?w=&h=&fit=clip); /content/dam/science/… serves the same file as is, whatever the query says — and so
// does the service when asked for ?w=0 (what WordPress writes for about 1% of the pictures, without any lighter
// size). The size comes from the tag or from the URL (?w=2048): a smaller picture is left alone (the service would
// enlarge it), an unknown one is resized (the original can weigh several MB). A GIF stays as is (a rendition would
// be a still frame), and so does one of NASA's own renditions (…/jcr:content/renditions/cq5dam.web.1280.1280.jpeg).
function lightImage(src, tag = '') {
  if (!src) return '';
  const url = new URL(src);
  const size = Math.max(
    ...[attr(tag, 'width'), attr(tag, 'height'), url.searchParams.get('w'), url.searchParams.get('h')].map(
      (value) => Number.parseInt(value, 10) || 0,
    ),
  );
  const file = /^\/(?:dynamicimage\/assets|content\/dam)(\/science\/[^:]+)$/i.exec(url.pathname)?.[1];
  return (size === 0 || size > 1280) && url.hostname === 'assets.science.nasa.gov' && file && !/\.gif$/i.test(file)
    ? `https://assets.science.nasa.gov/dynamicimage/assets${file}?w=1280&h=1280&fit=clip`
    : src;
}

// { mediaType, url, hdUrl, thumbnailUrl } from the media block above the post's title (the picture, NASA's video
// player or a YouTube/Vimeo embed). The featured image alone is not enough: posts without a picture carry the NASA
// logo or its "meatball" there, so it only serves as a lighter copy of the same picture, or — when it is in APOD's
// own folder — as a video's poster. No poster: thumbnailUrl '' (the player shows the video itself).
function mediaOf(post, content) {
  const media = (mediaType, url = '', hdUrl = '', thumbnailUrl = '') => ({ mediaType, url, hdUrl, thumbnailUrl });
  const image = featuredImage(post);
  const poster = image?.own ? lightImage(image.light || image.full) : '';
  const start = content.indexOf('media-detail-hero__media');
  const end = start < 0 ? -1 : content.indexOf('<h1', start);
  const hero = end < 0 ? '' : content.slice(start, end);

  // YouTube/Vimeo: an <iframe>, or the bare link when WordPress could not render the embed.
  const iframe = /<iframe\b[^>]*>/i.exec(hero);
  if (iframe || hero.includes('wp-block-embed')) {
    const embed = iframe ? attr(iframe[0], 'src') : plainText(hero);
    const youtube = YOUTUBE.exec(embed);
    if (youtube) {
      const thumbnail = poster || `https://img.youtube.com/vi/${youtube[1]}/hqdefault.jpg`;
      return media('video', `https://www.youtube.com/embed/${youtube[1]}?rel=0`, '', thumbnail);
    }
    const vimeo = VIMEO.exec(embed);
    if (vimeo) return media('video', `https://player.vimeo.com/video/${vimeo[1]}`, '', poster);
    return media('other'); // an interactive page (the old apod.nasa.gov ones now redirect away)
  }

  // NASA's own player: the first video file of <video src> or its <source> elements (not a stream playlist).
  const video = /<video\b([^>]*)>([\s\S]*?)<\/video>/i.exec(hero);
  if (video) {
    const tags = [`<video${video[1]}>`, ...(video[2].match(/<source\b[^>]*>/gi) ?? [])];
    const src = tags.map((tag) => httpsUrl(attr(tag, 'src'))).find((url) => VIDEO_FILE.test(pathOf(url)));
    const videoPoster = httpsUrl(attr(video[1], 'poster'));
    return src ? media('video', src, '', OWN_IMAGE.test(pathOf(videoPoster)) ? videoPoster : poster) : media('other');
  }

  const img = /<img\b[^>]*>/i.exec(hero);
  if (img) {
    const src = httpsUrl(attr(img[0], 'src'));
    // The picture links to its original file ("Clicking on the picture will download the highest resolution…").
    const link = /<a\b[^>]*>\s*<img\b/i.exec(hero);
    const linked = link ? httpsUrl(attr(link[0], 'href')) : '';
    const full = IMAGE_FILE.test(pathOf(linked)) ? linked : '';
    if (image && [fileName(full), fileName(src)].includes(fileName(image.full))) {
      // An animated GIF stays the original file (a rendition would be a still frame).
      let url = full;
      if (!image.gif) url = image.light ? lightImage(image.light) : lightImage(src, img[0]);
      return media('image', url || image.full, full || image.full);
    }
    if (src || full) return media('image', src ? lightImage(src, img[0]) : lightImage(full), full || src);
  }

  // A post without the usual media block: its featured image, if it is APOD's own picture.
  return !hero && image?.own ? media('image', poster, image.full) : media('other');
}

// The explanation paragraph without the notes NASA appends to it (Tomorrow's picture, mirrors, calendars…).
function explanationOf(content) {
  const paragraph = /<p\b[^>]*media-detail-hero__description[^>]*>([\s\S]*?)<\/p>/i.exec(content);
  if (!paragraph) return '';
  const [text] = paragraph[1].split(/<br\s*\/?>\s*<br\s*\/?>|<strong>\s*Tomorrow/i);
  // Some posts repeat the label ("<strong>Explanation:</strong> Explanation : What is…").
  return plainText(text).replace(/^(?:explanation\s*:\s*)+/i, '');
}

// The credit line of the post's details table, without its label ("Image Credit & Copyright: Name" → "Name").
// In 1997 the cell starts with the picture's caption on a line of its own ("Hale-Bopp and Andromeda <br> Credit and
// Copyright: A. Dimai…"): left out. So is the escaped start of a broken link some cells carry ("NASA / &lt;a GSFC").
function creditOf(content) {
  for (const [, label, value] of content.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>\s*<td\b[^>]*>([\s\S]*?)<\/td>/gi)) {
    if (!/credit|copyright/i.test(plainText(label))) continue;
    let cell = value.replace(/&lt;a\b\s*/gi, '');
    const br = /<br\s*\/?>/i.exec(cell);
    const rest = br ? cell.slice(br.index + br[0].length) : '';
    if (
      br &&
      !/credit|copyright/i.test(plainText(cell.slice(0, br.index))) &&
      /^[a-z &]*(?:credit|copyright)[a-z &]*:/i.test(plainText(rest))
    ) {
      cell = rest;
    }
    return plainText(cell).replace(CREDIT_LABEL, '').trim();
  }
  return '';
}

// Our payload from one NASA Science post, or null when it is not an APOD post. date: the day it was picked for (see
// dayPost: its title may name no day, or the wrong year); '' = the day its title names.
function postPayload(post, date = '') {
  const parts = titleParts(post?.title?.rendered);
  const day = date || parts?.date;
  // A title that names no day only loses its "APOD: 2026 April –" or "APOD: October 2026 –" ("Albert Einstein: 1879
  // – 1955" stays whole).
  const title =
    parts?.title ??
    (typeof post?.title?.rendered === 'string' ? plainText(post.title.rendered) : '')
      .replace(NO_DAY_PREFIX, '')
      .trim();
  if (!day || !title) return null;
  const content = typeof post.content?.rendered === 'string' ? post.content.rendered : '';
  const media = mediaOf(post, content);
  const link = httpsUrl(post.link);

  return {
    date: day,
    title,
    explanation: explanationOf(content),
    ...media,
    url: media.mediaType === 'other' ? link : media.url, // what NASA's page shows, when it can't be shown here
    copyright: creditOf(content),
    link,
  };
}

// One deadline for a whole direct read: its signal ends the request still running, and no request starts after it.
function startDeadline(ms) {
  const controller = new AbortController();
  const end = Date.now() + ms;
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, left: () => Math.max(0, end - Date.now()), stop: () => clearTimeout(timer) };
}

async function fetchPosts(params, deadline, path = '') {
  if (deadline.signal.aborted || deadline.left() === 0) throw new HttpError('Deadline', { code: 'TIMEOUT' });
  const query = new URLSearchParams({ _fields: POST_FIELDS, ...params });
  const body = await fetchJson(`${POSTS_URL}${path}?${query}`, {
    timeout: Math.min(8000, deadline.left()),
    signal: deadline.signal,
  });
  return (Array.isArray(body) ? body : [body]).filter((post) => post && typeof post === 'object');
}

// The APOD post of `date` among `posts` — when two titles name it, the one also published that day (NASA titled
// 2006-02-17 and 18 "2007"), else the first — or the most recent one up to today when `date` is '' (dated by
// postDay). Of two posts titled and published the same day, the last one is kept (2007-07-16: Manhattanhenge, most
// likely the missing 2007-07-13, then the Lagoon Nebula).
function pickPost(posts, date) {
  const today = apodToday();
  let best = null;
  let sameDay = null;
  for (const post of posts) {
    const named = titleParts(post?.title?.rendered)?.date ?? '';
    const postDate = !date && !named ? postDay(post) : named;
    if (!postDate) continue;
    if (!date) {
      // The newest; on the same day, a post whose title names it beats one dated by its publication.
      const titled = Boolean(named);
      if (postDate <= today && (postDate > (best?.date ?? '') || (postDate === best?.date && titled && !best.titled))) {
        best = { post, date: postDate, titled };
      }
    } else if (postDate === date) {
      if (typeof post.date === 'string' && post.date.slice(0, 10) === date) sameDay = post;
      else best ??= { post, date: postDate };
    }
  }
  return sameDay ?? best?.post ?? null;
}

// The APOD post of `date` among the posts published that day when no title names that day: the only APOD post
// (titled "APOD…", or in NASA's APOD section) whose WordPress date is `date` and whose title names no other day —
// one without the day ("APOD: 2026 April – …"), without "APOD:" (1995-12-19) or with the wrong year (2006-02-17 and
// 18, titled 2007). A title naming another day belongs to that day (a picture published late). null: none, or two.
function dayPost(posts, date) {
  const found = posts.filter((post) => {
    const rendered = post?.title?.rendered;
    const content = post?.content?.rendered;
    const named = titleParts(rendered)?.date ?? '';
    return (
      typeof post?.date === 'string' &&
      post.date.slice(0, 10) === date &&
      (/^APOD/i.test(typeof rendered === 'string' ? plainText(rendered) : '') ||
        APOD_SECTION.test(typeof content === 'string' ? content : '')) &&
      (!named || named.slice(4) === date.slice(4))
    );
  });
  return found.length === 1 ? found[0] : null;
}

const shiftDay = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

// The post of one day: what was published that day (the API also counts hidden entries, about 7 a day, hence 100
// per page), then a title search for the few published on another day. null = NASA has no picture that day.
async function findPost(date, deadline) {
  let failure = null;
  let post = null;
  try {
    const params = { after: `${shiftDay(date, -1)}T23:59:59`, before: `${shiftDay(date, 1)}T00:00:00` };
    const posts = await fetchPosts({ ...params, per_page: '100', _embed: 'wp:featuredmedia' }, deadline);
    post = pickPost(posts, date) ?? dayPost(posts, date);
  } catch (error) {
    // No answer (network error, timeout) or a rate limit: the searches would go to the same host, and the visitor has
    // already waited for the bridge. (The bridge, bound by its time budget instead, still searches after a slow answer.)
    if (!error?.status || error.status === 429) throw error;
    failure = error;
  }

  // Old titles may write the day with a leading zero ("APOD: 2000 January 01 – …"): one search for each form.
  const [year, month, day] = date.split('-');
  for (const dayText of new Set([String(Number(day)), day])) {
    if (post) break;
    try {
      const search = `APOD ${year} ${MONTHS[Number(month) - 1]} ${dayText}`;
      const params = { search, per_page: '100', _fields: 'id,title,date' };
      const found = pickPost(await fetchPosts(params, deadline), date);
      if (found) {
        post = pickPost(await fetchPosts({ _embed: 'wp:featuredmedia' }, deadline, `/${Number(found.id)}`), date);
      }
    } catch (error) {
      if (!failure) failure = error;
      if (!error?.status || error.status === 429) break; // no answer or a rate limit: same host, same fate
    }
  }

  // "No picture" only when every request was answered: one that failed proves nothing.
  if (!post && failure) throw failure;
  return post;
}

// The latest post: the newest "APOD" posts, or everything published in the last three days.
async function findLatest(deadline) {
  const queries = [
    { search: 'APOD', orderby: 'date', order: 'desc', per_page: '5' },
    { after: `${shiftDay(apodToday(), -3)}T00:00:00`, orderby: 'date', order: 'desc', per_page: '100' },
  ];
  let failure = null;
  for (const params of queries) {
    try {
      const post = pickPost(await fetchPosts({ ...params, _embed: 'wp:featuredmedia' }, deadline), '');
      if (post) return post;
    } catch (error) {
      if (!failure) failure = error;
      if (!error?.status || error.status === 429) break; // no answer or a rate limit: same host, same fate
    }
  }
  throw failure ?? new HttpError('No recent APOD', { code: 'UPSTREAM' });
}

// The Portuguese page in Portuguese, like the bridge's answers: title and explanation machine-translated in what is
// left of the deadline. NASA's English text, marked untranslated (the page then says so), when the translator fails
// or too little time is left.
async function inPortuguese(apod, deadline) {
  if (deadline.left() < TRANSLATE_MIN) return apod;
  const lines = await translateLines(apod.explanation ? [apod.title, apod.explanation] : [apod.title], {
    from: 'en',
    timeout: Math.min(6000, deadline.left()),
    signal: deadline.signal,
  });
  return lines ? { ...apod, title: lines[0], explanation: lines[1] ?? '', translated: true } : apod;
}

// Straight from the browser when the bridge can't answer, within NASA_DEADLINE. Today (also a date that is still
// today in New York) = the latest picture: like the bridge, the previous day's until NASA publishes the new one.
async function loadFromNasa(date, lang) {
  const deadline = startDeadline(NASA_DEADLINE);
  try {
    const latest = !date || date === apodToday();
    const post = latest ? await findLatest(deadline) : await findPost(date, deadline);
    if (!post) throw new HttpError('Not in the APOD archive', { status: 404, code: 'NOT_FOUND' });
    const apod = { ...toApod(postPayload(post, latest ? postDay(post) : date)), translated: false };
    return lang === 'pt' ? await inPortuguese(apod, deadline) : apod;
  } finally {
    deadline.stop();
  }
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

// The bridge first (cached, translated); when it can't answer, NASA Science directly. If that fails too, the bridge's
// error is the one shown (it knows how long a rate limit lasts), unless NASA has no picture for that day.
async function loadApod(date, lang) {
  const query = new URLSearchParams(date ? { date, lang } : { lang });
  let apod;
  try {
    apod = toApod(await fetchJson(`/nasa.php?${query}`, { timeout: 12000 }));
  } catch (error) {
    if (!FALLBACK_CODES.has(error?.code)) throw withRetryAt(error);
    try {
      return await loadFromNasa(date, lang);
    } catch (direct) {
      throw direct?.code === 'NOT_FOUND' ? direct : withRetryAt(error);
    }
  }
  if (lang !== 'pt' || apod.translated) return apod;
  // The bridge answers in English while its translator is failing — the server's address is the one rate-limited,
  // not the visitor's: the browser translates it then.
  const deadline = startDeadline(6000);
  try {
    return await inPortuguese(apod, deadline);
  } finally {
    deadline.stop();
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
