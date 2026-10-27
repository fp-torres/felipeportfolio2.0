import { Suspense, useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import Section from '../ui/Section';
import ErrorBoundary from '../ui/ErrorBoundary';
import { lazyWithRetry, preloadLazyIcons } from '../../lib/lazyWithRetry';
import { scrollToTarget } from '../../lib/motion';

const loadCvModal = () => import('../CvModal');
const CvModal = lazyWithRetry(loadCvModal, 'cv-modal');

// Warms the sheet's chunk (and the lazy icons it draws) so the first tap opens it without a network wait.
const preloadCvModal = () => {
  loadCvModal().catch(() => {});
  preloadLazyIcons();
};

// The footer's "Baixar CV" dispatches this event, so the whole page shares this one CV sheet.
const OPEN_CV_EVENT = 'open-cv';

const FOCUS = [
  { id: 'python', icon: 'simple-icons:python' },
  { id: 'java', icon: 'devicon-plain:java' },
  { id: 'rest', icon: 'solar:server-linear' },
  { id: 'react', icon: 'simple-icons:react' },
];

// Apple's inline highlight: the key technologies of the intro read in label-1 inside label-2 text.
const HIGHLIGHT = /\b(React|Node\.js|Java)\b/;

function highlightTech(text) {
  return text.split(HIGHLIGHT).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="text-label-1">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const PORTRAIT_SIZES = '(min-width: 1280px) 288px, (min-width: 1024px) 256px, 112px';

// Phones and tablets: one centred stack. ≥1024px: text left (7 cols) + portrait right (5 cols), centred in a
// first screen that stops short of the fold by the next section's top padding + 3.5rem, so its "~/carreira"
// and the top of its title peek in: the page visibly goes on (capped at 680px on tall screens).
// Landscape phones (short + < 1024px): avatar beside a left-aligned text column so "Baixar CV" stays on screen.
// The shortest ones (≤ 380px tall: iPhone SE/mini, 360px-wide Androids) get a compact tier. The two height
// tiers never overlap, so their values don't depend on the order Tailwind emits arbitrary media variants.
export default function Hero() {
  const { t } = useLanguage();
  const hero = t.hero;
  const [cv, setCv] = useState({ mounted: false, open: false });

  const openCv = useCallback(() => setCv({ mounted: true, open: true }), []);
  const closeCv = useCallback(() => setCv((state) => ({ ...state, open: false })), []);

  useEffect(() => {
    window.addEventListener(OPEN_CV_EVENT, openCv);
    return () => window.removeEventListener(OPEN_CV_EVENT, openCv);
  }, [openCv]);

  // Fetch the sheet's code once the page is idle: the primary action then opens instantly, and an
  // already-open tab keeps working even after a deploy replaces the hashed chunks.
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(preloadCvModal, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(preloadCvModal, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const goToContact = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    scrollToTarget('#contact');
  };

  return (
    <Section
      id="hero"
      labelledBy="hero-title"
      className="pt-[calc(var(--nav-h)+1.5rem)] min-[375px]:pt-[calc(var(--nav-h)+2.5rem)] lg:pb-0 lg:pt-nav [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:pt-[calc(var(--nav-h)+0.75rem)] [@media(orientation:landscape)_and_(min-height:380.01px)_and_(max-height:500px)_and_(max-width:1023px)]:pt-[calc(var(--nav-h)+1.25rem)]"
    >
      <div className="mx-auto flex max-w-[22rem] flex-col items-center text-center sm:max-w-[36rem] lg:grid lg:min-h-[min(680px,calc(100svh-var(--nav-h)-var(--section-y)-3.5rem))] lg:max-w-none lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-10 lg:text-left [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:gap-6 [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:max-w-none [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:flex-row [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:items-start [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:text-left [@media(orientation:landscape)_and_(min-height:380.01px)_and_(max-height:500px)_and_(max-width:1023px)]:gap-8">
        <div className="relative shrink-0 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:justify-self-end">
          <img
            src={hero.image}
            srcSet={hero.imageSrcSet}
            sizes={hero.imageSrcSet ? PORTRAIT_SIZES : undefined}
            alt={hero.imageAlt}
            width={500}
            height={625}
            fetchPriority="high"
            className="size-24 rounded-full bg-surface-1 object-cover object-[50%_22%] ring-1 ring-white/10 min-[375px]:size-28 lg:aspect-[4/5] lg:h-auto lg:w-64 lg:rounded-card lg:object-center xl:w-72 [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:size-[88px]"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 right-1.5 size-3 rounded-full bg-success ring-[3px] ring-bg min-[375px]:bottom-2 min-[375px]:right-2 lg:hidden [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:bottom-1 [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:right-1"
          />
        </div>

        <div className="flex w-full flex-col items-center lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:items-start [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:min-w-0 [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:flex-1 [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:items-start">
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 text-footnote text-label-2 lg:mt-0 lg:justify-start [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:mt-0 [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:justify-start">
            <span>{hero.location}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="status-dot" aria-hidden="true" />
              {hero.available}
            </span>
          </p>

          <h1
            id="hero-title"
            className="mt-2 text-display text-label-1 lg:mt-3 [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:text-[2.5rem] [@media(orientation:landscape)_and_(min-height:380.01px)_and_(max-height:500px)_and_(max-width:1023px)]:text-[2.75rem]"
          >
            {hero.name}
          </h1>
          <p className="mt-1.5 text-balance text-title-1 text-label-2 lg:mt-2 [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:mt-1 [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:text-title-2">
            {hero.role}
          </p>

          <p className="mt-4 max-w-reading text-lead text-label-2 lg:mt-6 [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:mt-3 [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:text-callout">
            {highlightTech(hero.aboutText)}
          </p>

          <div className="mt-6 flex w-full flex-col items-center gap-1 lg:mt-8 lg:w-auto lg:flex-row lg:gap-3 [@media(orientation:landscape)_and_(max-height:380px)_and_(max-width:1023px)]:mt-4 [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:w-auto [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:flex-row [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:gap-5 [@media(orientation:landscape)_and_(min-height:380.01px)_and_(max-height:500px)_and_(max-width:1023px)]:mt-5">
            <button
              type="button"
              onClick={openCv}
              onPointerEnter={preloadCvModal}
              onTouchStart={preloadCvModal}
              onFocus={preloadCvModal}
              aria-haspopup="dialog"
              className="btn-primary btn-lg w-full max-w-[20rem] lg:w-auto [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:w-auto"
            >
              {hero.ctaResume}
            </button>
            <a href="#contact" onClick={goToContact} className="text-link lg:hidden">
              {hero.ctaContact}
              <span aria-hidden="true" className="text-[1.1em] leading-none">
                ›
              </span>
            </a>
            <a href="#contact" onClick={goToContact} className="btn-secondary btn-lg hidden lg:inline-flex">
              {hero.ctaContact}
            </a>
          </div>

          {/* Label above the chips (inline only on desktop): in a landscape column the chips keep one row. */}
          <div className="mt-6 flex flex-col items-center gap-3 lg:mt-10 lg:flex-row lg:gap-4 [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:items-start">
            <p id="hero-focus" className="shrink-0 text-footnote text-label-2">
              {hero.currentFocus}
            </p>
            {/* Inline chips + text-wrap: balance → rows of equal length (2 + 2 on phones), never one orphan. */}
            <ul
              role="list"
              aria-labelledby="hero-focus"
              className="-m-1 text-balance text-center lg:text-left [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:text-left"
            >
              {FOCUS.map(({ id, icon }) => (
                <li key={id} className="chip m-1 align-top">
                  {/* ssr: drawn in the pre-rendered HTML too, so the chips never reflow at hydration. */}
                  <span className="grid size-4 shrink-0 place-items-center text-label-1/85" aria-hidden="true">
                    <Icon icon={icon} ssr className="size-4" />
                  </span>
                  {hero.focusLabels[id]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {cv.mounted && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <CvModal isOpen={cv.open} onClose={closeCv} />
          </Suspense>
        </ErrorBoundary>
      )}
    </Section>
  );
}
