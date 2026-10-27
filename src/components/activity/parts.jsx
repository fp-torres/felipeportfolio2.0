import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';

// Big number + caption (Apple "stat" tile). Unknown values are never rendered: the parent drops the tile.
// reserve: other captions this tile can switch to (e.g. one per WakaTime period). They are laid out invisibly in
// the same cell, so the tile keeps the height of the longest one and nothing below moves when the caption changes.
export function StatTile({ value, unit, label, reserve = [], loading = false, dimmed = false }) {
  if (loading) {
    return (
      // Same box as the loaded tile: number = one line of text-stat; caption = 2 lines of 24px (3 lines of 21px
      // under 360px, 1 line from 640px), so the data arrives without moving anything.
      <div aria-hidden="true" className="flex min-w-0 flex-col gap-3 rounded-card bg-surface-2 p-card max-[359px]:px-4 lg:justify-between">
        <span className="skeleton block h-[clamp(2.5rem,1.9rem_+_2.4vw,4rem)] w-20 rounded-control lg:w-28" />
        <span className="flex flex-col gap-2 py-1 max-[359px]:py-0">
          <span className="skeleton block h-4 w-full max-w-[9rem] rounded-pill" />
          <span className="skeleton block h-4 w-2/3 max-w-[6rem] rounded-pill sm:hidden" />
          <span className="skeleton hidden h-4 w-1/2 rounded-pill max-[359px]:block" />
        </span>
      </div>
    );
  }

  // Five or more characters ("1.024", "1.320") would not fit a 320px phone at the stat size.
  const long = String(value).length > 4;

  // Below 360px two tiles side by side leave ~94px of text width: a little less padding and a 15px caption
  // keep long words ("contribuições") inside the tile. Narrower than 320px (Galaxy Fold, 280px) even that is too
  // wide: the word is hyphenated there (the html carries the page language) or, failing that, broken.
  // Side by side (phones/tablets) the captions start on the same line under the numbers; stacked in the tall
  // desktop column (≥1024) the number sits at the top and the caption at the bottom.
  return (
    <div
      className={`flex min-w-0 flex-col gap-3 rounded-card bg-surface-2 p-card transition-opacity duration-base ease-standard max-[359px]:px-4 lg:justify-between ${
        dimmed ? 'opacity-60' : ''
      }`}
    >
      <p className={`tabular-nums text-label-1 ${long ? 'text-title-1 sm:text-stat' : 'text-stat'}`}>
        {value}
        {unit && <span className="ml-1 text-title-2 text-label-2">{unit}</span>}
      </p>
      <div className="grid grid-cols-1 break-words text-callout text-label-2 max-[359px]:text-subhead max-[319px]:hyphens-auto">
        <p className="[grid-area:1/1]">{label}</p>
        {reserve
          .filter((text) => text !== label)
          .map((text) => (
            <p key={text} aria-hidden="true" className="invisible [grid-area:1/1]">
              {text}
            </p>
          ))}
      </div>
    </div>
  );
}

// Footnote with a static status dot: success = fresh data, warning = last good reading.
export function StatusNote({ tone = 'success', children, className = '' }) {
  const warning = tone === 'warning';

  return (
    <p
      className={`flex items-start gap-2 text-footnote tabular-nums ${warning ? 'text-warning' : 'text-label-2'} ${className}`}
    >
      {/* Centred on the first line, also when the note wraps on a narrow phone. */}
      <span aria-hidden="true" className={`status-dot mt-[0.3125rem] ${warning ? 'bg-warning' : ''}`} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

// Calm error block (no data at all): icon, short message and a 44px "Try again".
export function ErrorBlock({ onRetry, className = '' }) {
  const { t } = useLanguage();

  return (
    <div role="status" className={`flex flex-col items-center px-2 py-6 text-center ${className}`}>
      <Icon icon="solar:cloud-cross-linear" aria-hidden="true" className="size-7 text-label-2" />
      <p className="mt-3 text-title-3 text-label-1">{t.ui.errorTitle}</p>
      <p className="mt-1 max-w-[22rem] text-callout text-label-2">{t.ui.errorText}</p>
      <button type="button" onClick={onRetry} className="btn-secondary mt-5">
        <Icon icon="solar:refresh-linear" aria-hidden="true" className="size-[1.125rem]" />
        {t.ui.retry}
      </button>
    </div>
  );
}
