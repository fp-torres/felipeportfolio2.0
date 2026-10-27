import { useEffect } from 'react';
import { fetchJson } from '../lib/http';
import { useResource } from '../lib/resource';

// WakaTime coding stats through our bridge (public/wakatime.php?range=…). Durations are formatted on the client.
export const WAKATIME_RANGES = ['last_7_days', 'last_30_days', 'all_time'];
export const DEFAULT_WAKATIME_RANGE = 'last_30_days';

const TTL = 15 * 60 * 1000;
const SCHEMA = 2; // bump whenever the normalised shape below changes
const LEGACY_KEYS = WAKATIME_RANGES.map((range) => `portfolio:wakatime:v2:${range}`); // previous implementation

const secondsOrNull = (value) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);

// Old bridges only send WakaTime's English text: "58 hrs 11 mins", "1 hr 6 mins", "27 mins", "45 secs", "3h 5min".
export function parseDuration(text) {
  if (typeof text !== 'string' || !/\d\s*[hms]/i.test(text)) return null;
  const read = (pattern) => Number(pattern.exec(text)?.[1] ?? 0);
  return read(/(\d+(?:\.\d+)?)\s*h/i) * 3600 + read(/(\d+)\s*m/i) * 60 + read(/(\d+)\s*s/i);
}

function normalizeLanguage(language, totalSeconds) {
  const name = typeof language?.name === 'string' ? language.name.trim() : '';
  if (!name) return null;
  const percent = Number(language.percent);
  const knownPercent = Number.isFinite(percent) && percent >= 0 ? percent : null;
  const seconds =
    secondsOrNull(language.seconds) ??
    parseDuration(language.text) ??
    (knownPercent !== null && totalSeconds !== null ? (totalSeconds * knownPercent) / 100 : null);
  return { name, percent: knownPercent, seconds };
}

// Tolerates the old bridge payload (texts only) and the new one (+ seconds, totalSeconds, dailyAverageSeconds, fetchedAt).
export function normalizeWakaTime(body, range) {
  const data = body?.data ?? {};
  const totalSeconds = secondsOrNull(data.totalSeconds) ?? parseDuration(data.totalText);

  return {
    range: WAKATIME_RANGES.includes(data.range) ? data.range : range,
    totalSeconds,
    dailyAverageSeconds: secondsOrNull(data.dailyAverageSeconds) ?? parseDuration(data.dailyAverageText),
    languages: (Array.isArray(data.languages) ? data.languages : [])
      .map((language) => normalizeLanguage(language, totalSeconds))
      .filter(Boolean),
    updatedAt: data.updatedAt || null,
    fetchedAt: data.fetchedAt || null,
    stale: data.stale === true,
  };
}

const loaders = Object.fromEntries(
  WAKATIME_RANGES.map((range) => [
    range,
    () => fetchJson(`/wakatime.php?range=${range}`, { timeout: 9000 }).then((body) => normalizeWakaTime(body, range)),
  ]),
);
const hasLanguages = (data) => Array.isArray(data?.languages);

let legacyCleared = false;
function clearLegacyCache() {
  if (legacyCleared) return;
  legacyCleared = true;
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked: nothing to clean.
  }
}

// group 'wakatime': while a newly selected range loads, the previous range stays on screen (data.range tells which).
export function useWakaTime(range, { enabled = true } = {}) {
  const key = WAKATIME_RANGES.includes(range) ? range : DEFAULT_WAKATIME_RANGE;
  useEffect(clearLegacyCache, []);
  return useResource(`wakatime:${key}`, loaders[key], {
    ttl: TTL,
    persist: true,
    schema: SCHEMA,
    enabled,
    validate: hasLanguages,
    group: 'wakatime',
  });
}
