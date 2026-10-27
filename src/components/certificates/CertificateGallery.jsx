import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { prefersReducedMotion } from '../../lib/motion';
import CertificateCard from './CertificateCard';

// Rendered width of one item (see the li classes below) — lets the browser pick from imageSrcSet.
const ITEM_SIZES = '(min-width: 1024px) 18rem, (min-width: 640px) 42vw, (orientation: landscape) 42vw, 78vw';

// The row bleeds to the screen edges at every width (apple.com galleries): the inline offset is the distance
// from the band's edge to the content edge, measured on the section (a size container, 100cqw = band width),
// so on wide screens the next card peeks at the screen edge instead of being cut at the container gutter.
// Browsers without container units drop these declarations and keep the .scroll-row gutter bleed.
const BLEED =
  '[margin-inline:calc(max(var(--gutter),(100cqw_-_75rem)/2)*-1)] [padding-inline:max(var(--gutter),(100cqw_-_75rem)/2)] [scroll-padding-inline:max(var(--gutter),(100cqw_-_75rem)/2)]';

// Horizontal scroll-snap gallery with peek (apple.com "Explore the lineup"): swipe on touch,
// paddles ‹ › with a pointer or from tablet width, Tab moves item by item.
export default function CertificateGallery({ items, onSelect }) {
  const { t } = useLanguage();
  const listId = useId();
  const rowRef = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = row.scrollWidth - row.clientWidth;
        const atStart = row.scrollLeft <= 2;
        const atEnd = row.scrollLeft >= max - 2;
        setEdges((prev) => (prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }));
      });
    };

    measure();
    row.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(row);

    return () => {
      cancelAnimationFrame(frame);
      row.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, []);

  // Pages by the number of fully visible items; scroll-snap keeps every stop aligned to the gutter.
  const page = (direction) => {
    const row = rowRef.current;
    if (!row) return;
    if ((direction < 0 && edges.atStart) || (direction > 0 && edges.atEnd)) return;

    const [first, second] = row.children;
    const style = getComputedStyle(row);
    const visible = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const stride = first && second ? second.offsetLeft - first.offsetLeft : visible;
    const gap = first ? stride - first.offsetWidth : 0;
    const perPage = Math.max(1, Math.floor((visible + gap) / stride));

    row.scrollBy({ left: direction * perPage * stride, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const hideControls = edges.atStart && edges.atEnd;

  return (
    <div>
      {/* py/-my: room for the focus ring, which the scroll container would otherwise clip. */}
      <ul id={listId} ref={rowRef} role="list" className={`scroll-row -my-2 py-2 ${BLEED}`}>
        {items.map((cert) => (
          // Phones on their side get the tablet width, so a whole card fits the short screen.
          <li
            key={cert.id}
            className="w-[78%] max-w-[20rem] max-sm:landscape:w-[42%] sm:w-[42%] lg:w-[calc((100%_-_3*var(--grid-gap))/4)]"
          >
            <CertificateCard cert={cert} onSelect={onSelect} sizes={ITEM_SIZES} />
          </li>
        ))}
      </ul>

      {!hideControls && (
        <div className="mt-4 hidden justify-end gap-3 md:flex can-hover:flex">
          <Paddle
            label={t.ui.previous}
            icon="solar:alt-arrow-left-linear"
            disabled={edges.atStart}
            controls={listId}
            onClick={() => page(-1)}
          />
          <Paddle
            label={t.ui.next}
            icon="solar:alt-arrow-right-linear"
            disabled={edges.atEnd}
            controls={listId}
            onClick={() => page(1)}
          />
        </div>
      )}
    </div>
  );
}

// aria-disabled (not disabled) so a keyboard user never loses focus when reaching an end.
function Paddle({ label, icon, disabled, controls, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls={controls}
      aria-disabled={disabled}
      onClick={onClick}
      className="icon-btn aria-disabled:pointer-events-none aria-disabled:opacity-30"
    >
      <Icon icon={icon} className="size-5" aria-hidden="true" />
    </button>
  );
}
