import { m as Motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { EASE } from '../../lib/motion';

// Small building blocks shared by the arcade games (inside the game sheet).

// Label above a tabular value, like Game Center / Fitness stats.
export function Stat({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="truncate text-footnote text-label-2">{label}</p>
      <p className="truncate text-title-3 font-semibold tabular-nums text-label-1">{value}</p>
    </div>
  );
}

// Filled heart = life left, outline = life lost (the filled glyph is the "on" state).
export function Lives({ count, max = 3, label }) {
  return (
    <div role="img" aria-label={label} className="flex shrink-0 items-center gap-1">
      {Array.from({ length: max }, (_, index) =>
        index < count ? (
          <Icon key={index} icon="solar:heart-bold" aria-hidden="true" className="size-5 text-danger" />
        ) : (
          <Icon key={index} icon="solar:heart-linear" aria-hidden="true" className="size-5 text-label-3" />
        ),
      )}
    </div>
  );
}

// Covers the board (start / pause / game over). Inherits the board's radius. The content is centred with
// auto margins: if it ever outgrows a tiny board it scrolls instead of being clipped at the top.
export function BoardOverlay({ children, className = '' }) {
  return (
    <div
      className={`absolute inset-0 z-raised flex flex-col overflow-y-auto rounded-[inherit] bg-bg/85 p-4 text-center ${className}`}
    >
      <div className="my-auto flex flex-col items-center gap-3">{children}</div>
    </div>
  );
}

// End of a round over the whole game area (win / game over). The parent must be `relative`. Same colour as
// the sheet and a few px larger than the area, so rings and corners of the game never peek out.
export function ResultOverlay({ children }) {
  return (
    <Motion.div
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE.standard }}
      className="absolute -inset-1 z-raised flex flex-col overflow-y-auto bg-surface-1 p-4 text-center"
    >
      <div className="my-auto flex flex-col items-center gap-3">{children}</div>
    </Motion.div>
  );
}

export function NewRecord({ label }) {
  return (
    <p className="inline-flex items-center gap-1.5 text-callout font-semibold text-label-1">
      <Icon icon="solar:cup-star-linear" aria-hidden="true" className="size-5" />
      {label}
    </p>
  );
}
