import { useSyncExternalStore } from 'react';

// Game records ("best scores"). localStorage can throw (private mode, storage blocked, quota full), so every
// access is guarded and an in-memory copy keeps the record for the current visit. A tiny external store lets
// the arcade sheet subtitle and the game itself update together when a record is broken.
const listeners = new Set();
const cache = new Map();

function read(key) {
  if (cache.has(key)) return cache.get(key);
  let value = null;
  try {
    value = window.localStorage.getItem(key);
  } catch {
    value = null;
  }
  cache.set(key, value);
  return value;
}

function subscribe(listener) {
  listeners.add(listener);
  // Another tab broke a record: drop the cached copy and re-read it.
  const onStorage = (event) => {
    if (event.key === null) cache.clear();
    else cache.delete(event.key);
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function saveRecord(key, value) {
  const raw = String(value);
  cache.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // Storage unavailable: the record still lasts until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

// Raw stored string (or null). Always null on the server and when there is no key.
export function useStoredRecord(key) {
  return useSyncExternalStore(subscribe, () => (key ? read(key) : null), () => null);
}

// Positive integer or null ("no record yet").
export function parseCount(raw) {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// Tech Memory keeps fewest moves per difficulty as JSON; 999 meant "no record" in older saves.
export function parseMemoryRecords(raw) {
  let saved = null;
  try {
    saved = JSON.parse(raw ?? 'null');
  } catch {
    saved = null;
  }
  const pick = (mode) => {
    const value = Number(saved?.[mode]);
    return Number.isFinite(value) && value > 0 && value < 999 ? value : null;
  };
  return { easy: pick('easy'), medium: pick('medium'), hard: pick('hard') };
}

export const RECORD_KEYS = {
  memory: 'techMemoryRecords',
  snake: 'snakeHighScore',
  sequence: 'sequenceHighScore',
  matrix: 'matrixRecallRecord',
  decryptor: 'decryptorRecord',
  zip: 'zipHighScore',
};
