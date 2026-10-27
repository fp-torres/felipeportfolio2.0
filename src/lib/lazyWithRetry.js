import { lazy } from 'react';

// Icons used only by the lazy chunks (games, Laboratório, CV sheet) are left out of the main bundle by
// scripts/build-icons.mjs. Requested once, with the first lazy component (or earlier by a preload that calls this).
// If it can't be loaded, components still render and @iconify/react fetches their icons from the Iconify API instead.
let lazyIcons = null;

export function preloadLazyIcons() {
  if (!lazyIcons) {
    lazyIcons = import('./icons.lazy.generated.js').catch(() => {
      lazyIcons = null; // the next lazy component tries again
    });
  }
  return lazyIcons;
}

// An open sheet's scroll lock pins <body> at top:-Y (scrollY is then 0). Undo it before reloading so the
// browser restores the visitor's real position instead of sending them to the top of the page.
function restoreLockedScroll() {
  const { body } = document;
  if (body.style.position !== 'fixed') return;
  const y = -parseInt(body.style.top || '0', 10) || 0;
  body.style.position = '';
  body.style.top = '';
  window.scrollTo(0, y);
}

// React.lazy that survives a missing chunk: after a deploy the old hashed files are gone, so a tab that was
// already open fails to load them. Retry once, then reload the page once (guarded per session) so the new
// index.html is fetched. If it still fails, the error reaches the nearest ErrorBoundary.
// Each component resolves only once those icons are registered, so they draw without any request to Iconify.
export function lazyWithRetry(factory, key) {
  const flag = `chunk-reload:${key}`;
  const load = async () => (await Promise.all([factory(), preloadLazyIcons()]))[0];

  return lazy(async () => {
    try {
      const module = await load();
      try {
        sessionStorage.removeItem(flag);
      } catch {
        // Storage can be unavailable (private mode); the reload guard just won't persist.
      }
      return module;
    } catch (firstError) {
      try {
        return await load();
      } catch {
        let alreadyReloaded = false;
        try {
          alreadyReloaded = sessionStorage.getItem(flag) === '1';
          if (!alreadyReloaded) sessionStorage.setItem(flag, '1');
        } catch {
          alreadyReloaded = true; // without storage we can't guard against reload loops
        }
        if (!alreadyReloaded) {
          restoreLockedScroll();
          window.location.reload();
          return new Promise(() => {}); // keep the Suspense fallback until the reload happens
        }
        throw firstError;
      }
    }
  });
}
