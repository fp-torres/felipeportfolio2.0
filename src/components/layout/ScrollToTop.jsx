import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m as Motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { DUR, EASE, scrollToTop } from '../../lib/motion';

// "Back to top" only appears when the visitor shows the intent to go back: scrolling UP by their own hand
// (touch, wheel/trackpad, keys) after ~2 screens. It steps aside while they read (any scroll down), after a
// short idle, near the top, and over the footer's legal line — so it never sits on content.
const MIN_DEPTH_VIEWPORTS = 2;
const UP_INTENT_PX = 64; // upward travel that reads as "going back", not a nudge or a bounce
const DOWN_HIDE_PX = 12; // downward travel that hides it again
const IDLE_MS = 1500; // once the page stops, it leaves quickly: it floats over content while it is shown
const INPUT_WINDOW_MS = 1200; // a scroll is the visitor's own when touch/wheel/keys moved it this recently
const TOUCH_SLOP_PX = 10; // a tap (a menu link, a card) jitters a few px; a drag goes further
// The footer keeps the dock's height + safe area as bottom padding; its legal line (≤ 2 lines + rule) sits
// right above it. Inside that zone at the end of the page the button stays hidden.
const LEGAL_ZONE_PX = 80;
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

function useBackToTopIntent() {
  const [visible, setVisible] = useState(false);
  // Hover / keyboard focus keep it on screen; the effect owns the timer, the button only flips this switch.
  const holdRef = useRef(() => {});

  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    let upTravel = 0;
    let downTravel = 0;
    let lastInput = -Infinity;
    let frame = 0;
    let idleTimer = 0;
    let shown = false;
    let held = false;
    let touchStartY = 0;
    let endZone = LEGAL_ZONE_PX;

    const measureEndZone = () => {
      const footer = document.getElementById('contact');
      const padding = footer ? parseFloat(window.getComputedStyle(footer).paddingBottom) || 0 : 0;
      endZone = padding + LEGAL_ZONE_PX;
    };

    const show = (next) => {
      if (next === shown) return;
      shown = next;
      if (!next) {
        // Unmounting under the pointer or with focus fires no pointerleave/blur: drop the hold with it.
        held = false;
        window.clearTimeout(idleTimer);
      }
      setVisible(next);
    };

    const armIdle = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (!held) show(false);
      }, IDLE_MS);
    };

    holdRef.current = (value) => {
      held = value;
      if (!value && shown) armIdle();
    };

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      if (delta === 0) return;
      // A sheet or the menu pins the page (useScrollLock): those jumps are not the visitor scrolling.
      if (root.dataset.overlayOpen !== undefined) {
        upTravel = 0;
        return;
      }

      const viewport = window.innerHeight;
      const deepEnough = y > viewport * MIN_DEPTH_VIEWPORTS;
      const clearOfLegal = root.scrollHeight - (y + viewport) > endZone;
      if (!deepEnough || !clearOfLegal) {
        upTravel = 0;
        show(false);
        return;
      }

      if (delta > 0) {
        upTravel = 0;
        downTravel += delta;
        if (downTravel >= DOWN_HIDE_PX) show(false);
        return;
      }

      downTravel = 0;
      if (shown) {
        armIdle(); // still heading up (or flying back after a tap): keep it while the page moves
        return;
      }
      // Anchors, menu links and scroll anchoring move the page too; only the visitor's own scroll counts.
      if (performance.now() - lastInput > INPUT_WINDOW_MS) {
        upTravel = 0;
        return;
      }
      upTravel -= delta;
      if (upTravel >= UP_INTENT_PX) {
        show(true);
        armIdle();
      }
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const onInput = () => {
      lastInput = performance.now();
    };
    const onTouchStart = (event) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event) => {
      const touch = event.touches[0];
      if (touch && Math.abs(touch.clientY - touchStartY) > TOUCH_SLOP_PX) onInput();
    };
    const onKeyDown = (event) => {
      if (SCROLL_KEYS.has(event.key)) onInput();
    };

    measureEndZone();
    const passive = { passive: true };
    window.addEventListener('scroll', onScroll, passive);
    window.addEventListener('resize', measureEndZone, passive);
    window.addEventListener('wheel', onInput, passive);
    window.addEventListener('touchstart', onTouchStart, passive);
    window.addEventListener('touchmove', onTouchMove, passive);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      window.removeEventListener('scroll', onScroll, passive);
      window.removeEventListener('resize', measureEndZone, passive);
      window.removeEventListener('wheel', onInput, passive);
      window.removeEventListener('touchstart', onTouchStart, passive);
      window.removeEventListener('touchmove', onTouchMove, passive);
      window.removeEventListener('keydown', onKeyDown);
      holdRef.current = () => {};
    };
  }, []);

  return [visible, holdRef];
}

// Right side of the FloatingDock. The 44px slot is always reserved, so the mini player beside it never
// changes width when the button comes and goes.
export default function ScrollToTop() {
  const { t } = useLanguage();
  const [visible, holdRef] = useBackToTopIntent();

  const hold = () => holdRef.current(true);
  const release = () => holdRef.current(false);

  return (
    <div className="ml-auto size-tap shrink-0">
      <AnimatePresence>
        {visible && (
          <Motion.button
            key="scroll-to-top"
            type="button"
            onClick={scrollToTop}
            onPointerEnter={hold}
            onPointerLeave={release}
            onFocus={hold}
            onBlur={release}
            aria-label={t.ui.scrollToTop}
            title={t.ui.scrollToTop}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: DUR.base, ease: EASE.emphasized } }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: DUR.fast, ease: EASE.exit } }}
            whileTap={{ scale: 0.92 }}
            className="material-dock pointer-events-auto grid size-tap place-items-center rounded-full text-label-1 shadow-float ring-1 ring-white/10 transition-[background-color] duration-fast ease-standard hover:bg-surface-2/90 active:bg-surface-3/90"
          >
            <Icon icon="solar:alt-arrow-up-linear" className="size-5" aria-hidden="true" />
          </Motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
