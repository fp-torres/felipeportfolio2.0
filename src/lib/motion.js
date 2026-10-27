// Motion tokens (Apple-like: short, ease-out, small distances, no overshoot, nothing looping at rest).
export const EASE = {
  standard: [0.25, 0.1, 0.25, 1], // colour / opacity / state changes
  emphasized: [0.22, 1, 0.36, 1], // entrances, sheets, reveals
  exit: [0.4, 0, 1, 1], // leaving the screen
};

export const DUR = { fast: 0.15, base: 0.25, slow: 0.4, slower: 0.6 };

// Blocks entering the viewport (once). Spread on a Motion element: <Motion.div {...reveal}>.
export const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: DUR.slower, ease: EASE.emphasized },
};

// Lists: parent + children variants (animate at most ~6 children).
export const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE.emphasized } },
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Programmatic scrolling that respects "Reduce motion". Accepts '#id', an element, or a selector.
export function scrollToTarget(target, { block = 'start' } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block });
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

// Use after closing something that held a scroll lock (mobile menu, sheet): the lock restores the
// previous scroll position on release, so the navigation scroll must start on a later frame.
export function scrollToTargetAfterUnlock(target, options) {
  requestAnimationFrame(() => requestAnimationFrame(() => scrollToTarget(target, options)));
}
