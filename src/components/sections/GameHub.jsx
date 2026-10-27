import { Suspense, useMemo, useState } from 'react';
import { m as Motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { lazyWithRetry, preloadLazyIcons } from '../../lib/lazyWithRetry';
import { reveal } from '../../lib/motion';
import ErrorBoundary from '../ui/ErrorBoundary';
import Section from '../ui/Section';
import SectionHeader from '../ui/SectionHeader';
import Sheet from '../ui/Sheet';
import { RECORD_KEYS, parseCount, parseMemoryRecords, useStoredRecord } from '../games/records';
import { fill } from '../games/text';
import { useElementSize } from '../games/useElementSize';
import { GameViewportContext } from '../games/viewport';

// Every game is its own chunk: requested at the first sign of intent (hover, focus, touch) and played inside a
// full-screen sheet. The gradients are app icons — the one place gradients are allowed.
const GAMES = [
  { id: 'memory', icon: 'solar:sd-card-linear', gradient: 'from-blue-500 to-cyan-500', load: () => import('../games/TechMemoryGame') },
  { id: 'snake', icon: 'solar:gamepad-linear', gradient: 'from-green-500 to-emerald-500', load: () => import('../games/SnakeGame') },
  { id: 'sequence', icon: 'solar:soundwave-linear', gradient: 'from-purple-500 to-pink-500', load: () => import('../games/CyberSequence') },
  { id: 'matrix', icon: 'solar:widget-linear', gradient: 'from-cyan-400 to-teal-500', load: () => import('../games/MatrixRecall') },
  { id: 'decryptor', icon: 'solar:shield-keyhole-linear', gradient: 'from-red-500 to-pink-600', load: () => import('../games/Decryptor') },
  { id: 'zip', icon: 'solar:code-scan-linear', gradient: 'from-gray-600 to-gray-500', load: () => import('../games/ZipGame') },
];

const GAME_COMPONENTS = Object.fromEntries(GAMES.map((game) => [game.id, lazyWithRetry(game.load, `game-${game.id}`)]));

const preload = (game) => {
  game.load().catch(() => {
    // The lazy component retries (and reports) on its own when it is actually rendered.
  });
  preloadLazyIcons();
};

// "Recorde: 120 pontos" for the sheet subtitle; updates live while playing.
function useRecordLabel(gameId) {
  const { t } = useLanguage();
  const text = t.minigames;
  const raw = useStoredRecord(gameId ? RECORD_KEYS[gameId] : null);
  if (!gameId) return null;

  if (gameId === 'memory') {
    const records = parseMemoryRecords(raw);
    const mode = ['hard', 'medium', 'easy'].find((key) => records[key] !== null);
    return mode ? fill(text.records.memory, { mode: text.memory.modes[mode], n: records[mode] }) : text.noRecord;
  }

  let value = parseCount(raw);
  // The Decryptor stores the next level to unlock; show the last one cracked.
  if (gameId === 'decryptor' && value !== null) value -= 1;
  return value ? fill(text.records[gameId], { n: value }) : text.noRecord;
}

// The area a game gets inside the sheet: the whole body on phones, a fixed height in the desktop dialog
// (header + paddings of the sheet stay under 7rem). Games size their boards from this, never from vh.
// wide = clearly landscape; short = landscape phone height (controls go beside the board).
function GameViewport({ children }) {
  const [ref, { width, height }] = useElementSize();
  const value = useMemo(
    () => ({ width, height, wide: width > 0 && width >= height * 1.25, short: height > 0 && height < 480 }),
    [width, height],
  );

  return (
    // Short landscape phones get the full-screen sheet too (Sheet.jsx), so the viewport fills it there as well.
    <div ref={ref} className="relative h-full sm:h-[min(calc(90dvh_-_7rem),40rem)] [@media(max-height:500px)]:!h-full">
      <GameViewportContext value={value}>{children}</GameViewportContext>
    </div>
  );
}

function GameLoading() {
  const { t } = useLanguage();

  return (
    <div role="status" className="flex h-full items-center justify-center gap-3 text-callout text-label-2">
      <span
        aria-hidden="true"
        className="size-5 rounded-full border-2 border-white/20 border-t-label-1 motion-safe:animate-spin"
      />
      {t.ui.loading}
    </div>
  );
}

// Browsers keep a failed module import for the life of the page, so the only real retry is a reload. The open
// sheet pins the page at offset 0 (scroll lock): put the page back where it was first, so the browser restores
// the visitor to the arcade after the reload instead of the top of the page.
function reloadKeepingPlace() {
  const pinnedTop = -Number.parseInt(document.body.style.top || '0', 10);
  const top = pinnedTop > 0 ? pinnedTop : window.scrollY;
  document.body.style.position = '';
  document.body.style.top = '';
  window.scrollTo({ top, behavior: 'instant' });
  window.location.reload();
}

// A game chunk that could not be downloaded (lazyWithRetry already retried it and, once per session, reloaded
// the page). Only the sheet shows the error: the rest of the site stays intact.
function GameUnavailable() {
  const { t } = useLanguage();

  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center px-4 text-center">
      <Icon icon="solar:danger-circle-linear" aria-hidden="true" className="size-7 text-label-2" />
      <p className="mt-3 text-title-3 text-label-1">{t.ui.errorTitle}</p>
      <p className="mt-1 max-w-xs text-callout text-label-2">{t.ui.errorText}</p>
      <button type="button" onClick={reloadKeepingPlace} className="btn-secondary mt-5">
        {t.ui.retry}
      </button>
    </div>
  );
}

const renderGameUnavailable = () => <GameUnavailable />;

export default function GameHub() {
  const { t } = useLanguage();
  const text = t.minigames;
  const [openId, setOpenId] = useState(null);
  const subtitle = useRecordLabel(openId);
  const ActiveGame = openId ? GAME_COMPONENTS[openId] : null;

  return (
    <Section id="minigames" labelledBy="minigames-title">
      <SectionHeader
        id="minigames-title"
        eyebrow={text.eyebrow}
        title={text.sectionTitle}
        lede={text.sectionSubtitle}
      />

      <Motion.ul {...reveal} className="grid grid-cols-2 gap-grid lg:grid-cols-3">
        {GAMES.map((game) => {
          const copy = text.descriptions[game.id];

          return (
            <li key={game.id} className="min-w-0">
              <button
                type="button"
                onClick={() => setOpenId(game.id)}
                onPointerEnter={() => preload(game)}
                onFocus={() => preload(game)}
                className="flex h-full w-full flex-col items-start gap-3 rounded-tile bg-surface-1 p-4 text-left transition-[background-color,transform] duration-fast ease-standard hover:bg-surface-1-hover active:scale-[0.98] lg:gap-4 lg:p-6"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-[52px] shrink-0 place-items-center rounded-media bg-gradient-to-br lg:size-16 ${game.gradient}`}
                >
                  <Icon icon={game.icon} className="size-7 text-white lg:size-9" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-callout font-semibold text-label-1 lg:text-body">{copy.title}</span>
                  {/* Below 360px a tile is ~100px wide: the short descriptions need a third line to stay whole
                      (a fourth below 300px, e.g. the first Galaxy Fold's cover screen). */}
                  <span className="line-clamp-2 text-footnote text-label-2 max-[359px]:line-clamp-3 max-[299px]:line-clamp-4">
                    {copy.desc}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </Motion.ul>

      <Sheet
        open={openId !== null}
        onClose={() => setOpenId(null)}
        size="full"
        title={openId ? text.descriptions[openId].title : ''}
        subtitle={subtitle}
      >
        <GameViewport>
          <ErrorBoundary key={openId} fallback={renderGameUnavailable}>
            <Suspense fallback={<GameLoading />}>{ActiveGame && <ActiveGame />}</Suspense>
          </ErrorBoundary>
        </GameViewport>
      </Sheet>
    </Section>
  );
}
