import { useEffect, useRef, useState } from 'react';
import ErrorBoundary from '../ui/ErrorBoundary';
import SpotifyWidget from '../SpotifyWidget';
import ScrollToTop from './ScrollToTop';

// Bottom floating chrome: Spotify mini player (left) + scroll-to-top (right) share one flex row, so they can
// never overlap each other. The row itself ignores pointer events; only its children are tappable.
// Hidden while a sheet or the mobile menu is open (useScrollLock sets html[data-overlay-open]).
//
// The first screen stays clean (hero + CTA): the mini player shows after one viewport of scrolling — and only
// then starts asking what is playing. "Back to top" decides on its own (scrolling up after ~2 screens).
export default function FloatingDock() {
  const firstScreenRef = useRef(null);
  const [pastFirstScreen, setPastFirstScreen] = useState(false);
  const [playerEnabled, setPlayerEnabled] = useState(false);

  // A sentinel one viewport tall at the top of the page: no scroll listener, no layout reads.
  useEffect(() => {
    const sentinel = firstScreenRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      const past = !entry.isIntersecting;
      setPastFirstScreen(past);
      if (past) setPlayerEnabled(true);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={firstScreenRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-[100vh] w-px" />
      <div className="floating-dock pointer-events-none fixed inset-x-0 bottom-0 z-dock flex items-end justify-between gap-3 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] transition-[opacity,visibility] duration-base ease-standard sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] [html[data-overlay-open]_&]:invisible">
        <ErrorBoundary>
          <SpotifyWidget enabled={playerEnabled} visible={pastFirstScreen} />
        </ErrorBoundary>
        <ScrollToTop />
      </div>
    </>
  );
}
