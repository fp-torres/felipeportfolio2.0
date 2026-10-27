import { useEffect, useState } from 'react';
import { fetchJson } from '../lib/http';

// What Felipe is listening to right now, for the floating mini player.
// The /spotify.php bridge is polled every 30 s while the tab is visible, with backoff on failures.
// Lanyard (Discord presence) is only a fallback for when the bridge fails or reports Spotify as unavailable,
// so a visitor never makes both requests on every poll. Returns null when nothing is playing.

const BRIDGE_URL = '/spotify.php';
const LANYARD_URL = 'https://api.lanyard.rest/v1/users/402555995462565891';
const POLL_MS = 30000;
const BACKOFF_MS = [60000, 120000, 300000]; // after 1, 2, 3+ consecutive failures
const MAX_WAIT_MS = 60 * 60000;
const FIRST_POLL_DELAY_MS = 1500; // keep the first request out of the page's critical loading
const TIMEOUT_MS = 6500;

// Once the bridge says Spotify isn't configured or authorised, it isn't asked again during this page session.
let bridgeDisabled = false;

const secondsToMs = (value) => (Number(value) > 0 ? Math.min(Number(value) * 1000, MAX_WAIT_MS) : 0);

const backoff = (failures, retryAfter) =>
  Math.max(BACKOFF_MS[Math.min(Math.max(failures, 1), BACKOFF_MS.length) - 1], secondsToMs(retryAfter));

function isPermanentBridgeError(error) {
  if (error?.code === 'AUTH_FAILED' || error?.code === 'NOT_CONFIGURED') return true;
  if (error?.status === 404) return true;
  // Older bridge versions answer "not configured" / "auth failed" with a bare 503 { error: "<text>" }, no retry hint.
  return error?.status === 503 && error?.code === 'UPSTREAM' && error?.retryAfter == null;
}

const httpsUrl = (value) => (typeof value === 'string' && value.startsWith('https://') ? value : '');

function fromBridge(body) {
  if (body?.isPlaying !== true) return null;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const url = httpsUrl(body.songUrl);
  if (!title || !url) return null;
  return {
    title,
    artist: typeof body.artist === 'string' ? body.artist.trim() : '',
    cover: httpsUrl(body.albumImageUrl),
    url,
  };
}

function fromLanyard(body) {
  const presence = body?.success ? body.data : null;
  const spotify = presence?.listening_to_spotify ? presence.spotify : null;
  const trackId = typeof spotify?.track_id === 'string' ? spotify.track_id : '';
  const title = typeof spotify?.song === 'string' ? spotify.song.trim() : '';
  if (!/^[A-Za-z0-9]+$/.test(trackId) || !title) return null;
  return {
    title,
    artist: typeof spotify.artist === 'string' ? spotify.artist.replaceAll('; ', ', ').trim() : '',
    cover: httpsUrl(spotify.album_art_url),
    url: `https://open.spotify.com/track/${trackId}`,
  };
}

const sameTrack = (a, b) =>
  a === b || (a !== null && b !== null && a.url === b.url && a.title === b.title && a.artist === b.artist && a.cover === b.cover);

export function useNowPlaying({ enabled = true } = {}) {
  const [track, setTrack] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let disposed = false;
    let polling = false;
    let timer;
    let controller;
    let dueAt = Date.now() + FIRST_POLL_DELAY_MS;
    let failures = 0; // consecutive polls where no source answered
    let bridgeFailures = 0; // consecutive transient bridge failures
    let bridgeRetryAt = 0;

    const arm = () => {
      clearTimeout(timer);
      if (disposed || polling || document.visibilityState === 'hidden') return;
      timer = setTimeout(poll, Math.max(0, dueAt - Date.now()));
    };

    async function poll() {
      polling = true;
      controller = new AbortController();
      const { signal } = controller;
      let answered = false;
      let next = null;
      let retryAfter = 0;

      if (!bridgeDisabled && Date.now() >= bridgeRetryAt) {
        try {
          const body = await fetchJson(BRIDGE_URL, { timeout: TIMEOUT_MS, signal, cache: 'no-store' });
          if (body?.isPlaying !== true && body?.available === false) {
            bridgeDisabled = true;
          } else {
            answered = true;
            next = fromBridge(body);
            retryAfter = body?.retryAfter;
            bridgeFailures = 0;
          }
        } catch (error) {
          if (signal.aborted) return;
          if (isPermanentBridgeError(error)) {
            bridgeDisabled = true;
          } else {
            bridgeFailures += 1;
            bridgeRetryAt = Date.now() + backoff(bridgeFailures, error?.retryAfter);
          }
        }
      }

      if (!answered) {
        try {
          next = fromLanyard(await fetchJson(LANYARD_URL, { timeout: TIMEOUT_MS, signal }));
          answered = true;
        } catch {
          if (signal.aborted) return;
        }
      }

      polling = false;
      if (disposed) return;

      if (answered) {
        failures = 0;
        setTrack((current) => (sameTrack(current, next) ? current : next));
      } else {
        failures += 1;
        // One blip keeps the last answer on screen; a second one in a row hides the player.
        if (failures > 1) setTrack(null);
      }

      dueAt = Date.now() + (answered ? Math.max(POLL_MS, secondsToMs(retryAfter)) : backoff(failures));
      arm();
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') clearTimeout(timer);
      else arm();
    };

    arm();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled]);

  return track;
}
