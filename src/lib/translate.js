import { fetchJson } from './http';

// Machine translation into Portuguese for the browser fallbacks (src/hooks/useApod.js, src/hooks/useTechNews.js):
// when a bridge can't answer and the browser reads NASA or DEV itself, the Portuguese page still gets Portuguese
// text. Same free endpoint as the bridges (public/nasa.php, public/news.php), which allows any origin. Best effort:
// null whenever the answer can't be trusted — the caller then keeps the original text, marked untranslated.
const ENDPOINT = 'https://translate.googleapis.com/translate_a/single?client=gtx&tl=pt&dt=t';

// keepTerms: only what the translator actually mangles stays as written — code identifiers (updated_at →
// "atualizados_at", useEffect, console.log()), CI ("IC"; CI/CD comes back intact), PR/MR ("RP"), pull/merge requests
// ("solicitação pull") and DEV's "Show DEV"/"Ask DEV". Acronyms it keeps by itself (API, REST, LLM, SDK, CLI, UI…) are
// left free, so it can still order them the Portuguese way ("API REST"); AI too, since "IA" is the Portuguese word.
// Same list and steps as public/news.php (NEWS_KEEP_TERMS): keep them in sync.
const KEEP_TERMS = new RegExp(
  [
    String.raw`\b(?:Show|Ask) DEV\b`,
    String.raw`\b[Pp]ull [Rr]equests?\b`,
    String.raw`\b[Mm]erge [Rr]equests?\b`,
    String.raw`\bCI\b(?!\/)`,
    String.raw`\b(?:PRs?|MRs?)\b`,
    String.raw`\b[A-Za-z_]\w+(?:\.[A-Za-z_]\w*)+(?:\(\))?`,
    String.raw`\b[A-Za-z_]\w*\(\)`,
    String.raw`\b[a-z]+(?:[A-Z][a-z0-9]*)+\b`,
    String.raw`\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+\b`,
  ].join('|'),
  'g',
);
// What the translator may turn the backticks into (seen: “PR”, 'solicitação pull'): [open, close, quotes of the same
// family]. Quotes only count as marks when no backtick is left and the original has no quote of that family (an
// apostrophe inside a word, "don't", isn't one) — the translator turns "…" into “…”, so a pair it may have produced
// itself is never taken for ours — and single quotes only when the translation has no apostrophe ("O'Reilly").
const MARKS = [
  ['`', '`', ''],
  ['“', '”', '"“”'],
  ['"', '"', '"“”'],
  ['‘', '’', "'‘’´"],
  ["'", "'", "'‘’´"],
  ['´', '´', "'‘’´"],
];

// Whitespace of any kind and control characters → one space; zero-width and bidi characters out.
const tidy = (text) =>
  text
    .replace(/[\u200B\uFEFF\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[\s\p{Cc}]+/gu, ' ')
    .trim();

// [line with the terms to keep between backticks — the translator leaves most of them alone —, those terms]. A line
// with backticks of its own is sent as is.
function protectTerms(line) {
  if (line.includes('`')) return [line, []];
  const terms = [];
  const marked = line.replace(KEEP_TERMS, (term) => {
    terms.push(term);
    return `\`${term}\``;
  });
  return [marked, terms];
}

const countOf = (text, char) => text.split(char).length - 1;
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The marks of a translated line: the first pair of MARKS found exactly once per term (null when none fits — a mark
// lost, a stray backtick…).
function markPattern(text, count, original) {
  const quotes = original.replace(/(\p{L})['’´](\p{L})/gu, '$1$2');
  const apostrophe = /\p{L}['’´]\p{L}/u.test(text);
  for (const [open, close, family] of MARKS) {
    if (
      open !== '`' &&
      (text.includes('`') ||
        (apostrophe && family.includes("'")) ||
        [...family].some((quote) => quotes.includes(quote)))
    ) {
      continue;
    }
    const fits =
      open === close
        ? countOf(text, open) === 2 * count
        : countOf(text, open) === count && countOf(text, close) === count;
    const pattern = new RegExp(`${escapeRegExp(open)}([^${escapeRegExp(open + close)}]*)${escapeRegExp(close)}`, 'g');
    if (fits && (text.match(pattern) ?? []).length === count) return pattern;
  }
  return null;
}

// Whether a mark that doesn't hold its term is the translator's rewrite of it ("RP", "solicitação pull") — short,
// one word for a one-word term, and without the term — rather than the term with text pulled into the mark ("PRs:",
// "CI Is", "IC está"), which is kept as is.
function rewritten(content, term) {
  if (!content) return true;
  const contains = new RegExp(`(?:^|[^A-Za-z0-9_])${escapeRegExp(term)}(?![A-Za-z0-9_])`, 'i').test(content);
  const words = content.split(/\s+/).filter(Boolean).length;
  return !contains && words <= (term.includes(' ') ? 3 : 1) && Array.from(content).length <= 2 * term.length + 6;
}

// The kept terms back in place of their marks: a mark holding the same text first, the others in order (the
// translator still rewrites a few: "`PR`" → "`RP`"). Without usable marks the translation stays as it came. Curly
// quotes the original didn't have become straight ones.
function restoreTerms(line, terms, original) {
  let text = line;
  if (terms.length > 0) {
    const pattern = markPattern(text, terms.length, original);
    if (pattern) {
      const contents = [...text.matchAll(pattern)].map((match) => match[1].trim());
      const free = [...terms];
      const same = contents.map((content) => {
        const index = free.findIndex((term) => term.toLowerCase() === content.toLowerCase());
        return index < 0 ? null : free.splice(index, 1)[0];
      });
      const replacements = contents.map((content, index) => {
        if (same[index]) return same[index];
        const term = free.shift() ?? '';
        return rewritten(content, term) ? term : content;
      });
      let position = 0;
      text = text.replace(pattern, (mark, content, offset, whole) => {
        // A kept term never touches a letter in the original: one glued to it lost its space in the translation.
        const before = /[\p{L}\p{N}]$/u.test(whole.slice(0, offset)) ? ' ' : '';
        const after = /^[\p{L}\p{N}]/u.test(whole.slice(offset + mark.length)) ? ' ' : '';
        return before + replacements[position++] + after;
      });
    }
    text = text.replace(/`/g, '');
  }
  if (!/[“”]/.test(original)) text = text.replace(/[“”]/g, '"');
  return tidy(text);
}

// Every line translated in one request (one line per text), or null when the translator fails or answers with
// another number of lines (a text merged with the next would be paired with the wrong one). from: 'en', or 'auto'
// for another language.
export async function translateLines(lines, { from = 'en', keepTerms = false, timeout = 6000, signal } = {}) {
  if (lines.length === 0) return [];
  const sent = lines.map((line) => (keepTerms ? protectTerms(line) : [line, []]));
  try {
    const body = await fetchJson(`${ENDPOINT}&sl=${encodeURIComponent(from)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ q: sent.map(([line]) => line).join('\n') }),
      timeout,
      signal,
    });
    const segments = Array.isArray(body?.[0]) ? body[0] : [];
    const text = segments.map((segment) => (typeof segment?.[0] === 'string' ? segment[0] : '')).join('');
    const translated = text.trim().split('\n').map(tidy);
    if (translated.length !== lines.length || translated.includes('')) return null;
    return translated.map((line, index) => restoreTerms(line, sent[index][1], lines[index]));
  } catch {
    return null;
  }
}
