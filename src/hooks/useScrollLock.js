import { useEffect } from 'react';

// Reference-counted body scroll lock that also works on iOS Safari (overflow:hidden alone does not).
// The page is pinned with position:fixed at its current offset and restored exactly on release.
// While any lock is active <html data-overlay-open> is set, which hides the floating dock.
let lockCount = 0;
let savedScrollY = 0;
let savedStyles = null;

function lock() {
  lockCount += 1;
  if (lockCount > 1) return;

  const { body, documentElement: html } = document;
  savedScrollY = window.scrollY;
  const scrollbarWidth = window.innerWidth - html.clientWidth;

  savedStyles = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
  };

  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
  html.dataset.overlayOpen = 'true';
}

function unlock() {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;

  const { body, documentElement: html } = document;
  Object.assign(body.style, savedStyles);
  delete html.dataset.overlayOpen;

  // Jump back instantly: html has scroll-behavior:smooth, which would animate the restore.
  const previousBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, savedScrollY);
  html.style.scrollBehavior = previousBehavior;
}

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    lock();
    return unlock;
  }, [active]);
}
