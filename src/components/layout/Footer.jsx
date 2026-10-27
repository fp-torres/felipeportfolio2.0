import { Suspense, useState } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { lazyWithRetry, preloadLazyIcons } from '../../lib/lazyWithRetry';
import ErrorBoundary from '../ui/ErrorBoundary';
import Sheet from '../ui/Sheet';
import LabStatus from '../lab/LabStatus';
import { ApodSkeleton, NewsSkeleton, TravelSkeleton } from '../lab/LabSkeletons';

const EMAIL = 'felipetorresaraujo@gmail.com';

const SOCIALS = [
  { key: 'linkedin', href: 'https://linkedin.com/in/felipe-torres-id', icon: 'simple-icons:linkedin' },
  { key: 'github', href: 'https://github.com/fp-torres', icon: 'simple-icons:github' },
  { key: 'instagram', href: 'https://instagram.com/fp.torresz', icon: 'simple-icons:instagram' },
  { key: 'whatsapp', href: 'https://wa.me/5521967600280', icon: 'simple-icons:whatsapp' },
];

// Laboratório: each experiment is its own chunk, requested at the first sign of intent (hover, focus, touch)
// and mounted inside a <Sheet> (portal) only once it has been opened.
const LAB = [
  { key: 'nasa', icon: 'solar:planet-linear', load: () => import('../NasaModal'), Skeleton: ApodSkeleton },
  { key: 'timeMachine', icon: 'solar:history-linear', load: () => import('../NasaTimeMachine'), Skeleton: TravelSkeleton },
  { key: 'radar', icon: 'solar:radar-2-linear', load: () => import('../TechNews'), Skeleton: NewsSkeleton },
].map((item) => ({ ...item, Content: lazyWithRetry(item.load, `lab-${item.key}`) }));

const preload = (item) => {
  item.load().catch(() => {
    // The lazy component retries (and reports) on its own when it is actually rendered.
  });
  preloadLazyIcons();
};

function LabUnavailable() {
  const { t } = useLanguage();
  const lab = t.footer.lab;

  return (
    <LabStatus icon="solar:danger-circle-linear" title={lab.failedTitle} text={lab.failedText}>
      <button type="button" onClick={() => window.location.reload()} className="btn-secondary">
        {lab.reload}
      </button>
    </LabStatus>
  );
}

const renderLabUnavailable = () => <LabUnavailable />;

export default function Footer() {
  const { t } = useLanguage();
  const lab = t.footer.lab;
  const [active, setActive] = useState(null);
  const [opened, setOpened] = useState({});
  const subtitles = { nasa: lab.apod.subtitle, timeMachine: lab.travel.subtitle, radar: lab.news.subtitle };

  // "© 2026 Felipe Torres." | "Todos os direitos reservados.": on narrow phones the line breaks between the
  // two sentences instead of in the middle of one.
  const [owner, ...rights] = t.footer.copyright.split('. ');

  const openLab = (key) => {
    setOpened((current) => (current[key] ? current : { ...current, [key]: true }));
    setActive(key);
  };
  const closeLab = () => setActive(null);
  // The Hero owns the CV sheet; it listens for this event.
  const openCv = () => window.dispatchEvent(new CustomEvent('open-cv'));

  return (
    <footer
      id="contact"
      aria-labelledby="contact-title"
      className="section bg-surface-1 pb-[calc(5rem+env(safe-area-inset-bottom))]"
    >
      <div className="container-page">
        <div className="mx-auto max-w-4xl text-center">
          <h2 id="contact-title" className="headline">
            {t.footer.title}
          </h2>
          <p className="lede mx-auto text-balance">{t.footer.subtitle}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center">
            <a href={`mailto:${EMAIL}`} className="btn-primary btn-lg w-full max-w-[20rem] sm:w-auto sm:min-w-44">
              {t.footer.emailBtn}
            </a>
            <button
              type="button"
              onClick={openCv}
              className="btn-secondary btn-lg w-full max-w-[20rem] sm:w-auto sm:min-w-44"
            >
              {t.footer.cvBtn}
            </button>
          </div>
        </div>

        <ul aria-label={t.footer.socialLabel} className="mt-10 flex justify-center gap-4 sm:mt-12 sm:gap-6">
          {SOCIALS.map(({ key, href, icon }) => (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t.footer.social[key]} (${t.ui.opensInNewTab})`}
                className="group flex flex-col items-center gap-2 rounded-tile sm:min-w-20"
              >
                <span className="grid size-tap place-items-center rounded-full bg-white/10 text-label-1 transition-colors duration-fast ease-standard group-hover:bg-white/15 group-active:bg-white/20">
                  <Icon icon={icon} className="size-5" aria-hidden="true" />
                </span>
                <span
                  aria-hidden="true"
                  className="hidden text-footnote text-label-2 transition-colors duration-fast ease-standard group-hover:text-label-1 sm:block"
                >
                  {t.footer.social[key]}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-14 max-w-[36rem] sm:mt-16">
          <h3 id="lab-title" className="text-center text-callout font-semibold text-label-2">
            {lab.title}
          </h3>
          <ul aria-labelledby="lab-title" className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {LAB.map((item) => (
              <li key={item.key} className="flex">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => openLab(item.key)}
                  onPointerEnter={() => preload(item)}
                  onPointerDown={() => preload(item)}
                  onFocus={() => preload(item)}
                  className="flex min-h-[88px] w-full flex-col items-center justify-center gap-2 rounded-tile bg-surface-2 p-3 text-center transition-[background-color,transform] duration-fast ease-standard hover:bg-surface-3 active:scale-[0.97] active:bg-surface-3 sm:p-4"
                >
                  <Icon icon={item.icon} className="size-[22px] shrink-0 text-label-1" aria-hidden="true" />
                  {/* Two-line box on narrow screens: icons stay aligned whether the name wraps or not. */}
                  <span className="flex min-h-[2.8em] items-center text-footnote font-semibold text-label-1 sm:text-callout md:min-h-0">
                    {lab[item.key]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 border-t border-separator/10 pt-6 sm:mt-16">
          <p className="text-center text-caption text-label-3">
            {rights.length > 0 ? (
              <>
                <span className="inline-block">{owner}.</span> <span className="inline-block">{rights.join('. ')}</span>
              </>
            ) : (
              t.footer.copyright
            )}
          </p>
        </div>
      </div>

      {LAB.map(
        (item) =>
          opened[item.key] && (
            <Sheet
              key={item.key}
              open={active === item.key}
              onClose={closeLab}
              title={lab[item.key]}
              subtitle={subtitles[item.key]}
              size="lg"
            >
              <ErrorBoundary fallback={renderLabUnavailable}>
                <Suspense fallback={<item.Skeleton />}>
                  <item.Content />
                </Suspense>
              </ErrorBoundary>
            </Sheet>
          ),
      )}
    </footer>
  );
}
