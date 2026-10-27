import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

// Tiny data layer (no dependency): one in-flight request per key shared by every component, memory cache,
// optional localStorage persistence and stale-while-revalidate.
//
//   const { data, status, error, savedAt, retry } = useResource('github', () => fetchJson('/github.php'), { ttl, persist: true });
//
// status: 'idle' (disabled, nothing cached) | 'loading' (no data yet) | 'ready' | 'revalidating' (showing cached
// data while refreshing) | 'stale' (showing cached data, last refresh failed) | 'error' (no data, failed).
const entries = new Map();
const lastDataByGroup = new Map();
const STORAGE_PREFIX = 'portfolio:res:';

function entryFor(key) {
  let entry = entries.get(key);
  if (!entry) {
    entry = { data: undefined, savedAt: 0, error: null, promise: null, version: 0, listeners: new Set(), hydrated: false };
    entries.set(key, entry);
  }
  return entry;
}

function emit(entry) {
  entry.version += 1;
  entry.listeners.forEach((listener) => listener());
}

function hydrate(key, entry, { persist, schema, validate, group }) {
  if (entry.hydrated) return;
  entry.hydrated = true;
  if (!persist || entry.data !== undefined) return;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved?.schema !== schema || typeof saved.savedAt !== 'number') return;
    if (validate && !validate(saved.data)) return;
    entry.data = saved.data;
    entry.savedAt = saved.savedAt;
    if (group) lastDataByGroup.set(group, saved.data);
  } catch {
    // Storage blocked or corrupt entry: just fetch.
  }
}

function persistEntry(key, entry, schema) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ schema, savedAt: entry.savedAt, data: entry.data }));
  } catch {
    // Quota exceeded or storage blocked: memory cache still works.
  }
}

function load(key, entry, loader, { persist, schema, validate, group }) {
  if (entry.promise) return entry.promise;

  entry.promise = Promise.resolve()
    .then(loader)
    .then((data) => {
      if (validate && !validate(data)) throw new Error(`Invalid data for "${key}"`);
      entry.data = data;
      entry.savedAt = Date.now();
      entry.error = null;
      if (group) lastDataByGroup.set(group, data);
      if (persist) persistEntry(key, entry, schema);
    })
    .catch((error) => {
      entry.error = error;
    })
    .finally(() => {
      entry.promise = null;
      emit(entry);
    });

  emit(entry);
  return entry.promise;
}

// group: optional name shared by related keys (e.g. 'wakatime' for every range) — while a new key loads,
// the last data of the group stays on screen instead of flashing a skeleton.
export function useResource(
  key,
  loader,
  { ttl = 5 * 60 * 1000, persist = false, schema = 1, enabled = true, validate, group } = {},
) {
  const entry = entryFor(key);
  const options = { persist, schema, validate, group };
  hydrate(key, entry, options);

  const loaderRef = useRef(loader);
  const optionsRef = useRef(options);
  useEffect(() => {
    loaderRef.current = loader;
    optionsRef.current = options;
  });

  const subscribe = useCallback(
    (listener) => {
      entry.listeners.add(listener);
      return () => entry.listeners.delete(listener);
    },
    [entry],
  );
  // -1 while pre-rendering and hydrating: render the same "no data yet" markup as the server did,
  // and only show cached/persisted data after hydration.
  const version = useSyncExternalStore(subscribe, () => entry.version, () => -1);
  const hydrating = version === -1;

  const revalidate = useCallback(
    (force = false) => {
      const isFresh = entry.data !== undefined && Date.now() - entry.savedAt < ttl;
      if (!force && isFresh) return;
      load(key, entry, () => loaderRef.current(), optionsRef.current);
    },
    [key, entry, ttl],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    revalidate();

    const onFocus = () => {
      if (document.visibilityState === 'visible') revalidate();
    };
    window.addEventListener('online', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('online', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [enabled, revalidate]);

  if (hydrating) {
    return { data: undefined, status: enabled ? 'loading' : 'idle', error: null, savedAt: null, retry: () => revalidate(true) };
  }

  const hasData = entry.data !== undefined;
  const loading = Boolean(entry.promise);
  let status;
  if (hasData) status = loading ? 'revalidating' : entry.error ? 'stale' : 'ready';
  else if (loading) status = 'loading';
  else if (entry.error) status = 'error';
  else status = enabled ? 'loading' : 'idle';

  return {
    data: hasData ? entry.data : group ? lastDataByGroup.get(group) : undefined,
    status,
    error: entry.error,
    savedAt: entry.savedAt || null,
    retry: () => revalidate(true),
  };
}
