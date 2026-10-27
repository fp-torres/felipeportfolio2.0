import { AnimatePresence, m as Motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../context/useLanguage';
import { useNowPlaying } from '../hooks/useNowPlaying';
import { DUR, EASE } from '../lib/motion';

// Floating "now playing" mini player (left side of the FloatingDock). Renders nothing when nothing is playing.
// enabled: start polling (the dock turns it on once the visitor scrolls); visible: show it if something plays.
export default function SpotifyWidget({ enabled = true, visible = true }) {
  const { t } = useLanguage();
  const track = useNowPlaying({ enabled });

  const label = track
    ? `${t.dock.nowPlaying.replace('{track}', () => track.title).replace('{artist}', () => track.artist)} (${t.ui.opensInNewTab})`
    : '';

  return (
    <AnimatePresence>
      {visible && track && (
        <Motion.a
          key="now-playing"
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={track.artist ? `${track.title} — ${track.artist}` : track.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE.emphasized } }}
          exit={{ opacity: 0, y: 12, transition: { duration: DUR.base, ease: EASE.exit } }}
          className="material-dock pointer-events-auto flex h-14 min-w-0 max-w-[22rem] flex-1 items-center gap-3 rounded-tile pl-2 pr-4 shadow-float ring-1 ring-white/10 transition-[background-color] duration-fast ease-standard hover:bg-surface-2/90 active:bg-surface-3/90 [@media(max-height:500px)]:flex-none [@media(max-height:500px)]:pr-3"
        >
          {track.cover ? (
            <img
              src={track.cover}
              alt=""
              width={40}
              height={40}
              decoding="async"
              referrerPolicy="no-referrer"
              className="size-10 shrink-0 rounded-[8px] bg-surface-2 object-cover"
            />
          ) : (
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-surface-2 text-label-2">
              <Icon icon="solar:music-note-2-linear" className="size-5" />
            </span>
          )}

          {/* Landscape phones keep only the cover + live bars, so the dock barely covers the short screen. */}
          <span className="min-w-0 flex-1 [@media(max-height:500px)]:hidden">
            <span className="block truncate text-callout font-semibold text-label-1">{track.title}</span>
            {track.artist && <span className="block truncate text-footnote text-label-2">{track.artist}</span>}
          </span>

          {/* Live indicator: animated only when the visitor allows motion, static bars otherwise. */}
          <span aria-hidden="true" className="flex h-3.5 shrink-0 items-end gap-[3px]">
            <span className="h-full w-[3px] origin-bottom scale-y-[0.45] rounded-full bg-success motion-safe:animate-eq-bar motion-safe:[animation-delay:-0.3s]" />
            <span className="h-full w-[3px] origin-bottom scale-y-[0.9] rounded-full bg-success motion-safe:animate-eq-bar motion-safe:[animation-delay:-0.6s]" />
            <span className="h-full w-[3px] origin-bottom scale-y-[0.65] rounded-full bg-success motion-safe:animate-eq-bar" />
          </span>
        </Motion.a>
      )}
    </AnimatePresence>
  );
}
