// Formatting shared by the Activity tiles (GitHub + WakaTime). Pure and SSR-safe.
const NBSP = '\u00a0';

export const localeFor = (lang) => (lang === 'pt' ? 'pt-BR' : 'en-US');

export const isKnown = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

// "Atualizado às {time}" → fill(template, { time: '12:04' })
export const fill = (template, values) =>
  String(template).replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));

// forms = { one, other } with {n}; PT and EN share the same singular rule.
export const plural = (forms, n, locale) =>
  fill(n === 1 ? forms.one : forms.other, { n: new Intl.NumberFormat(locale).format(n) });

// Seconds → "58 h 11 min" · "3 h" · "27 min" (same units in PT and EN). null when unknown.
export function formatDuration(seconds, locale) {
  if (!isKnown(seconds)) return null;
  // Truncate like WakaTime does ("2 hrs 31 mins" for 9108 s), so the numbers match its dashboard.
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 1) return seconds > 0 ? `<${NBSP}1${NBSP}min` : `0${NBSP}min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}${NBSP}min`;
  const h = `${new Intl.NumberFormat(locale).format(hours)}${NBSP}h`;
  return minutes ? `${h} ${minutes}${NBSP}min` : h;
}

// Big-number version for a stat tile: { value: '58', unit: 'h' } for 58 h 11 min (whole hours, never rounded
// up past what the detailed card shows; minutes under one hour).
export function statDuration(seconds, locale) {
  if (!isKnown(seconds)) return null;
  if (seconds < 3600) return { value: String(Math.floor(seconds / 60)), unit: 'min' };
  return { value: new Intl.NumberFormat(locale).format(Math.floor(seconds / 3600)), unit: 'h' };
}

const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  // Epoch seconds (PHP time()) or milliseconds, or an ISO string.
  const date = new Date(typeof value === 'number' && value < 1e12 ? value * 1000 : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// → { sameDay, text } where text is "12:04" today or "25 de out., 12:04" otherwise; null when unknown.
// today = new Date().toDateString() from useToday() (null on the server → always the long form).
export function formatStamp(value, locale, today) {
  const date = toDate(value);
  if (!date) return null;
  const time = { hour: locale === 'pt-BR' ? '2-digit' : 'numeric', minute: '2-digit' };
  if (today && date.toDateString() === today) {
    return { sameDay: true, text: new Intl.DateTimeFormat(locale, time).format(date) };
  }
  return { sameDay: false, text: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', ...time }).format(date) };
}

// Footnote under a data card. Fresh: "Atualizado às 12:04" / "Atualizado em 25 de out., 12:04".
// Stale (showing the last good copy): "Mostrando a leitura das 12:04" / "Mostrando a última leitura de 25 de out., 12:04".
// → { tone, text } or null when there is nothing true to say.
export function freshnessNote(stamp, stale, t) {
  if (stale) {
    if (!stamp) return { tone: 'warning', text: t.activity.lastReadingUnknown };
    const template = stamp.sameDay ? t.activity.lastReadingToday : t.ui.lastReading;
    return { tone: 'warning', text: fill(template, { time: stamp.text }) };
  }
  if (!stamp) return null;
  const text = stamp.sameDay ? fill(t.ui.updatedAt, { time: stamp.text }) : fill(t.activity.updatedOn, { date: stamp.text });
  return { tone: 'success', text };
}
