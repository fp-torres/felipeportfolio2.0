import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, m as Motion } from 'framer-motion';
import { useLanguage } from '../../context/useLanguage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useScrollLock } from '../../hooks/useScrollLock';
import { EASE, scrollToTargetAfterUnlock, scrollToTop } from '../../lib/motion';
import Segmented from '../ui/Segmented';

const LINKS = [
  { id: 'hero', key: 'home' },
  { id: 'experience', key: 'experience' },
  { id: 'certificates', key: 'certificates' },
  { id: 'projects', key: 'projects' },
  { id: 'skills', key: 'skills' },
  { id: 'minigames', key: 'minigames' },
];

// Every section in page order for the scroll-spy; the ones without a link (activity, contact) highlight nothing.
const SPY_IDS = ['hero', 'experience', 'certificates', 'projects', 'skills', 'activity', 'minigames', 'contact'];

// The sections with a filled yellow button of their own ("Baixar CV", "Enviar e-mail"). While one of them shows
// below the bar, the bar's "Contato" pill goes quiet: one filled yellow button per screen.
const CTA_SECTION_IDS = ['hero', 'contact'];
const DESKTOP_BAR_PX = 52; // --nav-h from 1024px, the only widths where the pill is shown

const DESKTOP_QUERY = '(min-width: 1024px)';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]';

const menuVariants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.24, ease: EASE.standard, staggerChildren: 0.03 } },
  gone: { opacity: 0, transition: { duration: 0.2, ease: EASE.exit } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -8 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE.emphasized } },
};

// The scroll lock puts the page back where it was on release, so scrolling starts a couple of frames later.
const afterUnlock = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

// Switching the language changes the length of every text above the reading line. Browsers only partly make
// up for it (Safari has no scroll anchoring; Chrome skips anchors inside transformed reveals), so the bar keeps
// the element just below it where it was.
function readingAnchor(header) {
  const y = header.getBoundingClientRect().bottom + 12;
  for (const x of [window.innerWidth / 2, Math.min(48, window.innerWidth / 4)]) {
    const element = document
      .elementsFromPoint(x, y)
      .find(
        (node) =>
          !header.contains(node) &&
          !node.closest('.floating-dock') &&
          node !== document.body &&
          node !== document.documentElement,
      );
    if (element) return { element, top: element.getBoundingClientRect().top };
  }
  return null;
}

function keepReadingPosition(anchor) {
  if (!anchor?.element.isConnected) return;
  const shift = anchor.element.getBoundingClientRect().top - anchor.top;
  if (Math.abs(shift) < 1) return;
  // html has scroll-behavior: smooth; this correction must be instant to stay invisible.
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollBy(0, shift);
  html.style.scrollBehavior = previous;
}

export default function Navbar() {
  const { lang, t, toggleLanguage, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [current, setCurrent] = useState(null);
  // Starts true (also in the pre-rendered HTML): the page opens on the hero, which has its own yellow button.
  const [ctaSectionInView, setCtaSectionInView] = useState(true);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  // The menu only exists below 1024px: crossing the breakpoint (rotation, resize) closes it and frees the scroll.
  const menuOpen = open && !isDesktop;

  const topSentinelRef = useRef(null);
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const firstLinkRef = useRef(null);
  // Reading position captured when the language changed under the open menu (the page is pinned meanwhile).
  const pendingAnchorRef = useRef(null);

  useScrollLock(menuOpen);

  // Once the menu releases the page, put back what the visitor was reading if the language changed meanwhile.
  // Menu links clear it first: they scroll somewhere else on their own.
  useEffect(() => {
    if (menuOpen) return undefined;
    const anchor = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    if (!anchor) return undefined;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => keepReadingPosition(anchor));
    });
    return () => cancelAnimationFrame(frame);
  }, [menuOpen]);

  // Hairline under the bar once the page has scrolled: a sentinel at the top of the document instead of a
  // scroll listener (no work per scroll event, no layout read on mount).
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Scroll-spy: the section crossing a thin band at ~40% of the viewport height is the current one.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const inBand = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        });
        let id = null;
        SPY_IDS.forEach((candidate) => {
          if (inBand.has(candidate)) id = candidate;
        });
        if (id) setCurrent(id);
      },
      { rootMargin: '-40% 0px -59% 0px' },
    );
    SPY_IDS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  // Watches the hero and the contact footer themselves rather than the scroll-spy: the 40% line leaves the hero
  // while its "Baixar CV" is still on screen, and on tall screens it never reaches the (short) footer.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const showing = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) showing.add(entry.target.id);
          else showing.delete(entry.target.id);
        });
        setCtaSectionInView(showing.size > 0);
      },
      { rootMargin: `-${DESKTOP_BAR_PX}px 0px 0px 0px` },
    );
    CTA_SECTION_IDS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  // Growing to the desktop layout (rotation, resize, split view) closes the menu for good, so it can't pop
  // back open on the way down. Registered once: the re-render caused by the breakpoint itself must not remove it.
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onBreakpoint = (event) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener('change', onBreakpoint);
    return () => desktop.removeEventListener('change', onBreakpoint);
  }, []);

  // While the menu is open: focus its first link, keep Tab inside the bar + menu, close on Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    firstLinkRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        menuButtonRef.current?.focus({ preventScroll: true });
        return;
      }
      if (event.key !== 'Tab' || !headerRef.current) return;
      const items = [...headerRef.current.querySelectorAll(FOCUSABLE)].filter(
        (element) => element.tabIndex >= 0 && element.getClientRects().length > 0,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!headerRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => {
    setOpen(false);
    menuButtonRef.current?.focus({ preventScroll: true });
  };

  const goHome = (event) => {
    event.preventDefault();
    if (menuOpen) {
      pendingAnchorRef.current = null;
      closeMenu();
      afterUnlock(scrollToTop);
    } else {
      scrollToTop();
    }
  };

  // Menu links: close first (releasing the scroll lock), then scroll — otherwise the unlock cancels the scroll.
  const navigate = (event, id) => {
    event.preventDefault();
    pendingAnchorRef.current = null;
    closeMenu();
    if (id === 'hero') afterUnlock(scrollToTop);
    else scrollToTargetAfterUnlock(`#${id}`);
  };

  // A tap on the overlay itself (not on a link or control) closes the menu.
  const onMenuClick = (event) => {
    if (!event.target.closest('a, button, [role="radiogroup"]')) closeMenu();
  };

  // Render the new language right away, then scroll by however much the content above the reading line moved
  // (before the frame is painted, so nothing visibly jumps). Native anchoring is paused so it can't add to it.
  const switchLanguage = (apply) => {
    const header = headerRef.current;
    const anchor = header ? readingAnchor(header) : null;
    const root = document.documentElement;
    root.style.overflowAnchor = 'none';
    flushSync(apply);
    if (menuOpen) pendingAnchorRef.current ??= anchor;
    else keepReadingPosition(anchor);
    requestAnimationFrame(() => root.style.removeProperty('overflow-anchor'));
  };

  const changeLanguage = (next) => {
    if (next === lang) return;
    switchLanguage(() => (setLanguage ? setLanguage(next) : toggleLanguage()));
  };

  const languageOptions = [
    { value: 'pt', label: t.ui.languageNames.pt },
    { value: 'en', label: t.ui.languageNames.en },
  ];

  return (
    <>
      <div ref={topSentinelRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-2 w-px" />

      <header ref={headerRef} className="fixed inset-x-0 top-0 z-nav pt-[env(safe-area-inset-top)]">
        {/* The glass lives on its own layer: a backdrop-filter on an ancestor would trap the fixed menu below. */}
        <div
          aria-hidden="true"
          className={`material-nav absolute inset-0 transition-[background-color] duration-base ease-standard ${
            menuOpen ? 'bg-bg' : ''
          }`}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-separator/10 transition-opacity duration-base ease-standard ${
            scrolled && !menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <nav
          aria-label={t.ui.mainNav}
          className="container-page relative flex h-nav items-center justify-between gap-4 pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))] lg:grid lg:grid-cols-[1fr_auto_1fr]"
        >
          <a
            href="#hero"
            onClick={goHome}
            aria-label={t.nav.logoLabel}
            className="-ml-2.5 inline-flex h-tap min-w-tap items-center justify-self-start rounded-control px-2.5 text-[19px] font-semibold leading-none tracking-[-0.02em] text-label-1 transition-opacity duration-fast ease-standard focus-visible:outline-offset-0 active:opacity-60"
          >
            FT
          </a>

          <ul className="hidden items-center lg:flex">
            {LINKS.map(({ id, key }) => {
              const active = current === id;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={active ? 'true' : undefined}
                    className={`relative inline-flex h-tap items-center rounded-control px-3 text-footnote transition-[color,opacity] duration-fast ease-standard focus-visible:outline-offset-0 active:opacity-60 xl:px-4 ${
                      active ? 'text-label-1' : 'text-label-1/80 hover:text-label-1'
                    }`}
                  >
                    {t.nav[key]}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-3 bottom-[11px] h-px bg-label-1 transition-opacity duration-base ease-standard xl:inset-x-4 ${
                        active ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="-mr-2.5 flex items-center justify-self-end lg:mr-0 lg:gap-2">
            {/* While the menu is open its Segmented control owns the language: the bar keeps only FT + close. */}
            <button
              type="button"
              onClick={() => switchLanguage(toggleLanguage)}
              aria-label={t.ui.switchLanguage}
              title={t.ui.switchLanguage}
              className={`inline-flex h-tap min-w-tap items-center justify-center rounded-pill px-2 text-footnote font-medium text-label-1/80 transition-[color,opacity,visibility] duration-fast ease-standard hover:text-label-1 focus-visible:outline-offset-0 active:bg-white/10 ${
                menuOpen ? 'invisible opacity-0' : ''
              }`}
            >
              {lang === 'pt' ? 'EN' : 'PT'}
            </button>

            {/* Small pill on desktop inside a 44px-tall link, so touch laptops and tablets get a full target. Yellow
                only away from the hero and the contact footer; beside their own yellow buttons it fades to grey
                (same size, so nothing moves). */}
            <a
              href="#contact"
              className="group hidden h-tap items-center rounded-pill focus-visible:outline-none lg:inline-flex"
            >
              <span
                className={`btn-sm duration-base group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-primary group-active:scale-[0.98] ${
                  ctaSectionInView
                    ? 'btn-secondary group-hover:bg-white/15 group-active:bg-white/20'
                    : 'btn-primary group-hover:bg-primary-hover group-active:bg-primary-pressed'
                }`}
              >
                {t.nav.contact}
              </span>
            </a>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t.ui.closeMenu : t.ui.openMenu}
              className="grid size-tap place-items-center rounded-full transition-colors duration-fast ease-standard focus-visible:outline-offset-0 active:bg-white/10 lg:hidden"
            >
              <span aria-hidden="true" className="relative block h-[1.5px] w-[18px]">
                <span
                  className={`absolute inset-0 rounded-full bg-label-1 transition-transform duration-base ease-emphasized ${
                    menuOpen ? 'rotate-45' : '-translate-y-[3.5px]'
                  }`}
                />
                <span
                  className={`absolute inset-0 rounded-full bg-label-1 transition-transform duration-base ease-emphasized ${
                    menuOpen ? '-rotate-45' : 'translate-y-[3.5px]'
                  }`}
                />
              </span>
            </button>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <Motion.div
                key="mobile-menu"
                id="mobile-menu"
                initial="hidden"
                animate="shown"
                exit="gone"
                variants={menuVariants}
                onClick={onMenuClick}
                className="fixed inset-x-0 bottom-0 top-[calc(var(--nav-h)+env(safe-area-inset-top))] z-menu bg-bg lg:hidden"
              >
                {/* Opaque, like the bar above it while open: the menu covers the whole page, and through a glass the
                    hero's yellow button glowed behind the links. */}
                <div className="container-page flex h-full flex-col overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))] pt-3 [@media(max-height:500px)]:pt-1">
                  {/* Landscape phones: two columns read top to bottom, on the same tracks as the actions below. */}
                  <ul className="[@media(max-height:500px)]:grid [@media(max-height:500px)]:max-w-xl [@media(max-height:500px)]:grid-flow-col [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:grid-rows-3 [@media(max-height:500px)]:gap-x-3">
                    {LINKS.map(({ id, key }, index) => (
                      <Motion.li key={id} variants={itemVariants}>
                        <a
                          ref={index === 0 ? firstLinkRef : undefined}
                          href={`#${id}`}
                          onClick={(event) => navigate(event, id)}
                          aria-current={current === id ? 'true' : undefined}
                          className="flex min-h-12 items-center py-1 text-[28px] font-semibold leading-[1.15] tracking-[-0.015em] text-label-1 transition-opacity duration-fast ease-standard active:opacity-60"
                        >
                          {t.nav[key]}
                        </a>
                      </Motion.li>
                    ))}
                  </ul>

                  <Motion.div
                    variants={itemVariants}
                    className="mt-auto grid w-full gap-3 pt-8 sm:max-w-sm [@media(max-height:500px)]:max-w-xl [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:pt-6"
                  >
                    <a href="#contact" onClick={(event) => navigate(event, 'contact')} className="btn-primary btn-lg w-full">
                      {t.nav.contact}
                    </a>
                    <Segmented
                      options={languageOptions}
                      value={lang}
                      onChange={changeLanguage}
                      label={t.ui.language}
                      fullWidth
                    />
                  </Motion.div>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>
    </>
  );
}
