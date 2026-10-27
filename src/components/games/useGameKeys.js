import { useEffect, useRef } from 'react';

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const ACTIVATABLE = 'button, a[href], summary, [role="button"]';

// Keyboard shortcuts for a game. The listener only exists while the game is mounted (its sheet is open) and
// ignores keys typed into fields, shortcuts with modifiers and Space/Enter on a focused button (those press
// the button). The handler returns true when it used the key — only then is the default (scrolling) prevented.
export function useGameKeys(handler, enabled = true) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(EDITABLE)) return;
      if ((event.key === ' ' || event.key === 'Enter') && target?.closest(ACTIVATABLE)) return;
      if (handlerRef.current?.(event)) event.preventDefault();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
