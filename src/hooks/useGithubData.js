import { useEffect } from 'react';
import { fetchJson } from '../lib/http';
import { useResource } from '../lib/resource';

// GitHub contributions + profile through our own bridge (public/github.php: token and cache stay on the server).
// One request per page: every component calling this hook shares the same resource entry.
export const GITHUB_PROFILE_URL = 'https://github.com/fp-torres';

const TTL = 30 * 60 * 1000;
const SCHEMA = 2; // bump whenever the normalised shape below changes (old persisted copies are ignored)
const LEGACY_KEYS = ['portfolio:github-card:v1']; // cache of the previous implementation

const countOrNull = (value) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);

function normalizeDay(day) {
  const date = typeof day?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day.date) ? day.date : null;
  if (!date) return null;
  const weekday =
    Number.isInteger(day.weekday) && day.weekday >= 0 && day.weekday <= 6
      ? day.weekday
      : new Date(`${date}T00:00:00Z`).getUTCDay();
  return { date, weekday, count: countOrNull(day.count) ?? 0 };
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;
  const htmlUrl = typeof profile.htmlUrl === 'string' && profile.htmlUrl.startsWith('https://github.com/') ? profile.htmlUrl : null;
  return { repos: countOrNull(profile.repos), followers: countOrNull(profile.followers), htmlUrl };
}

// Tolerates the old bridge payload ({ totalContributions, weeks, source, stale }) and the new one (+ profile, fetchedAt).
export function normalizeGithub(body) {
  const data = body?.data ?? {};
  const weeks = (Array.isArray(data.weeks) ? data.weeks : [])
    .map((week) => ({ days: (Array.isArray(week?.days) ? week.days : []).map(normalizeDay).filter(Boolean) }))
    .filter((week) => week.days.length > 0);

  return {
    totalContributions: countOrNull(data.totalContributions),
    weeks,
    profile: normalizeProfile(data.profile),
    stale: data.stale === true,
    fetchedAt: data.fetchedAt ?? null,
  };
}

const loadGithub = () => fetchJson('/github.php', { timeout: 9000 }).then(normalizeGithub);
const hasWeeks = (data) => Array.isArray(data?.weeks) && data.weeks.length > 0;

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

// enabled: false until the section is near the viewport (the data is below the fold).
export function useGithubData({ enabled = true } = {}) {
  useEffect(clearLegacyCache, []);
  return useResource('github', loadGithub, { ttl: TTL, persist: true, schema: SCHEMA, enabled, validate: hasWeeks });
}
