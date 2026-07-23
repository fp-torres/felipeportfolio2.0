import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useLanguage } from '../context/useLanguage';

const DISCORD_ID = '402555995462565891';
const POLL_INTERVAL_MS = 30000;
const REQUEST_TIMEOUT_MS = 6500;

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeSpotifyBridge(data) {
  if (data?.isPlaying !== true || !data.title || !data.songUrl) return null;

  return {
    song: data.title,
    artist: data.artist,
    albumArtUrl: data.albumImageUrl,
    url: data.songUrl,
  };
}

function normalizeLanyard(data) {
  const spotify = data?.success && data?.data?.listening_to_spotify
    ? data.data.spotify
    : null;

  if (!spotify?.track_id) return null;

  return {
    song: spotify.song,
    artist: spotify.artist,
    albumArtUrl: spotify.album_art_url,
    url: `https://open.spotify.com/track/${spotify.track_id}`,
  };
}

export default function SpotifyWidget() {
  const { lang } = useLanguage();
  const isPt = lang === 'pt';
  const [spotifyData, setSpotifyData] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchMusicData = async () => {
      if (document.visibilityState !== 'visible') return;

      let currentTrack = null;

      try {
        currentTrack = normalizeSpotifyBridge(await fetchJson('/spotify.php'));
      } catch {
        // The Discord presence fallback below keeps the widget resilient.
      }

      if (!currentTrack) {
        try {
          currentTrack = normalizeLanyard(
            await fetchJson(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`),
          );
        } catch {
          currentTrack = null;
        }
      }

      if (active) setSpotifyData(currentTrack);
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') fetchMusicData();
    };

    fetchMusicData();
    const interval = window.setInterval(fetchMusicData, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  return (
    <div className="spotify-widget fixed left-4 sm:left-6 md:left-8 z-[60] max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {spotifyData && (
          <Motion.a
            href={spotifyData.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`${isPt ? 'Ouvindo agora' : 'Now playing'}: ${spotifyData.song} — ${spotifyData.artist}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            whileHover={{ scale: 1.03 }}
            className="bg-[#0a0f1d]/95 backdrop-blur-md border border-white/10 p-2.5 sm:p-3 rounded-2xl shadow-[0_10px_40px_rgba(30,215,96,0.25)] flex items-center gap-3 sm:gap-4 w-[min(320px,calc(100vw-2rem))] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          >
            <div className="relative w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5">
              <img
                src={spotifyData.albumArtUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover motion-safe:animate-[spin_15s_linear_infinite]"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <Icon icon="mdi:spotify" className="text-green-400 text-xl sm:text-2xl" />
              </div>
            </div>

            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-green-400 tracking-widest flex items-center gap-1.5">
                  <span className="flex items-end gap-[2px] h-2.5" aria-hidden="true">
                    <Motion.span animate={{ height: ['40%', '100%', '40%'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-green-400 rounded-t-sm" />
                    <Motion.span animate={{ height: ['100%', '50%', '100%'] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-0.5 bg-green-400 rounded-t-sm" />
                    <Motion.span animate={{ height: ['60%', '100%', '60%'] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-green-400 rounded-t-sm" />
                  </span>
                  {isPt ? 'Ouvindo agora' : 'Now playing'}
                </span>
              </div>

              <h4 className="text-white text-xs sm:text-sm font-bold truncate leading-tight">
                {spotifyData.song}
              </h4>
              <p className="text-gray-400 text-[10px] sm:text-xs truncate font-mono mt-0.5 italic">
                {spotifyData.artist}
              </p>
            </div>
          </Motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
