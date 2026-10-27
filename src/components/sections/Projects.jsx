import { useState } from 'react';
import { m as Motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { reveal } from '../../lib/motion';
import Section from '../ui/Section';
import SectionHeader from '../ui/SectionHeader';
import ScreenFrame from '../ui/ScreenFrame';
import Sheet from '../ui/Sheet';

// A leading "[Sistema Privado]"-style tag in the data is shown as the "Privado" badge, not as text.
const LEADING_TAG = /^\s*\[([^\]]+)\]\s*/;

// Acronyms such as "NFS-e" must never break at the hyphen: keep the regular hyphen (Inter has no U+2011 glyph)
// followed by a word joiner (U+2060), which forbids the line break.
const keepTogether = (text = '') => text.replace(/\b([A-Z]{2,})-([a-z])\b/g, '$1-\u2060$2');

const isUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

// "React · Node.js · Express": each name stays whole and a line never starts with "·" (no-break spaces inside
// names and before the dot; the line may only wrap after "· ").
const techLine = (techs) => techs.map((tech) => tech.replace(/ /g, '\u00a0')).join('\u00a0· ');

// Card visuals are about half the container wherever they sit side by side: the regular cards from 640px (two
// columns, see the grid below), the wide cards' media half from 768px, and both on phones held sideways.
const CARD_SIZES =
  '(min-width: 1280px) 600px, (min-width: 768px) calc(50vw - 64px), (min-width: 640px) calc(50vw - 48px), (orientation: landscape) calc(50vw - 48px), calc(100vw - 48px)';
const WIDE_CARD_SIZES =
  '(min-width: 1280px) 600px, (min-width: 768px) calc(50vw - 64px), (orientation: landscape) calc(50vw - 48px), calc(100vw - 48px)';
// Sheet visual: half of the dialog when text sits beside it (landscape, desktop), the full sheet width otherwise.
const SHEET_SIZES = '(min-width: 1024px) 440px, (orientation: landscape) 45vw, (min-width: 640px) calc(100vw - 6rem), 100vw';

// Phones on their side: the sheet is only ~300px tall, so its actions move up next to the title instead of
// taking a fixed footer row (the same rule the certificate sheet follows).
const COMPACT_QUERY = '(orientation: landscape) and (max-height: 540px)';

function describe(project) {
  const raw = project.description ?? '';
  const tag = raw.match(LEADING_TAG);

  return {
    title: keepTogether(project.title),
    description: keepTogether(tag ? raw.slice(tag[0].length) : raw),
    isPrivate: project.private ?? (tag ? /priv/i.test(tag[1]) : false),
    techs: project.techs ?? [],
  };
}

// Only real URLs become links ("#" and null placeholders are skipped).
function externalLinks(project, actions) {
  return [
    { key: 'code', href: project.github, label: actions.code },
    { key: 'visit', href: project.link, label: actions.visit },
    { key: 'video', href: project.video, label: actions.video },
  ].filter((link) => isUrl(link.href));
}

function Arrow({ children }) {
  return (
    <span aria-hidden="true" className="text-[1.1em] leading-none">
      {children}
    </span>
  );
}

function PrivateBadge({ className = '' }) {
  const { t } = useLanguage();

  return (
    <span
      className={`inline-flex items-center gap-1.5 self-start rounded-pill bg-white/[0.08] px-2.5 py-1 text-footnote font-medium text-label-2 ${className}`}
    >
      <Icon icon="solar:lock-keyhole-minimalistic-linear" ssr className="size-3.5" aria-hidden="true" />
      {t.projects.privateLabel}
    </span>
  );
}

function ProjectFrame({ project, title, sizes, loading, className }) {
  const { t } = useLanguage();

  return (
    <ScreenFrame
      src={project.image}
      srcSet={project.imageSrcSet}
      sizes={sizes}
      width={project.imageWidth}
      height={project.imageHeight}
      contain={project.containImage}
      position={project.imagePosition}
      alt={t.projects.imageAlt?.replace('{title}', title) ?? title}
      loading={loading}
      className={className}
    />
  );
}

// Always-visible text links: "Detalhes ›" opens the sheet, external ones open in a new tab. They take the size
// of the card's description; three of them still fit one line on a 320px phone.
function ProjectActions({ project, title, detailsLabel, onDetails, linkClassName, className = '' }) {
  const { t } = useLanguage();
  const links = externalLinks(project, t.projects.actions);

  return (
    <div className={`flex flex-wrap items-center gap-x-4 ${className}`}>
      <button
        type="button"
        onClick={onDetails}
        aria-haspopup="dialog"
        aria-label={`${detailsLabel}: ${title}`}
        className={`text-link ${linkClassName}`}
      >
        {detailsLabel}
        <Arrow>›</Arrow>
      </button>
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${link.label}: ${title} (${t.ui.opensInNewTab})`}
          className={`text-link ${linkClassName}`}
        >
          {link.label}
          <Arrow>↗</Arrow>
        </a>
      ))}
    </div>
  );
}

// wide = full-width card: visual on top on portrait phones, text left + visual right from 768px and on phones
// held sideways, so the visual never outgrows a short screen. Portrait screens of 640–767px keep it stacked:
// split there, the text would be squeezed into a ~240px column next to a small visual.
function ProjectCard({ project, featured = false, wide = false, onDetails }) {
  const { t } = useLanguage();
  const { title, description, isPrivate, techs } = describe(project);
  const detailsLabel =
    featured && project.details ? t.projects.actions.technicalDetails : t.projects.actions.details;
  const textSize = featured ? 'text-callout sm:text-body' : 'text-callout';

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-card bg-surface-1 ${
        wide
          ? 'md:grid md:grid-cols-2 md:items-center md:gap-8 md:p-card lg:gap-10 max-md:landscape:grid max-md:landscape:grid-cols-2 max-md:landscape:items-center max-md:landscape:gap-6 max-md:landscape:p-card'
          : ''
      }`}
    >
      <ProjectFrame
        project={project}
        title={title}
        sizes={wide ? WIDE_CARD_SIZES : CARD_SIZES}
        className={wide ? 'md:order-2 md:rounded-media max-md:landscape:order-2 max-md:landscape:rounded-media' : ''}
      />

      <div className={`flex flex-1 flex-col p-card ${wide ? 'md:order-1 md:p-0 max-md:landscape:order-1 max-md:landscape:p-0' : ''}`}>
        {techs.length > 0 && <p className="text-footnote text-label-2">{techLine(techs)}</p>}
        <h3 className={`mt-2 text-label-1 ${featured ? 'text-title-1' : 'text-title-2'}`}>{title}</h3>
        {isPrivate && <PrivateBadge className="mt-3" />}
        <p className={`mt-3 text-label-2 ${textSize} ${featured ? '' : 'line-clamp-3'}`}>{description}</p>
        <ProjectActions
          project={project}
          title={title}
          detailsLabel={detailsLabel}
          onDetails={onDetails}
          linkClassName={textSize}
          className="mt-auto pt-3"
        />
      </div>
    </article>
  );
}

const SHEET_ACTION_ORDER = ['visit', 'code', 'video'];

function ProjectSheet({ project, open, onClose }) {
  const { t } = useLanguage();
  const compact = useMediaQuery(COMPACT_QUERY);
  if (!project) return null;

  const { title, description, isPrivate, techs } = describe(project);
  const paragraphs = (project.details ? keepTogether(project.details) : description)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const links = externalLinks(project, t.projects.actions).sort(
    (a, b) => SHEET_ACTION_ORDER.indexOf(a.key) - SHEET_ACTION_ORDER.indexOf(b.key),
  );

  const actions = links.length > 0 && (
    <div className={`flex flex-wrap gap-3 ${compact ? 'mt-5' : 'sm:justify-end'}`}>
      {links.map((link, index) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${link.label}: ${title} (${t.ui.opensInNewTab})`}
          className={`${index === 0 ? 'btn-primary' : 'btn-secondary'} ${compact ? '' : 'grow sm:grow-0'}`}
        >
          {link.label}
          <Arrow>↗</Arrow>
        </a>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} title={title} size="lg" hideTitle footer={(!compact && actions) || null}>
      {/* Portrait (phones, tablets): visual on top, text below at reading width. Landscape and desktop: the
          visual stays in view on the left while the text scrolls on the right. */}
      <div className="landscape:grid landscape:grid-cols-2 landscape:items-start landscape:gap-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <ProjectFrame
          project={project}
          title={title}
          sizes={SHEET_SIZES}
          loading="eager"
          className="rounded-tile landscape:sticky landscape:top-0 lg:sticky lg:top-0"
        />

        <div className="mt-6 max-w-reading landscape:mt-0 lg:mt-0">
          {/* The dialog is already labelled by the (visually hidden) sheet title. */}
          <p aria-hidden="true" className="text-title-2 text-label-1">
            {title}
          </p>
          {isPrivate && <PrivateBadge className="mt-3" />}
          {compact && actions}
          <div className="mt-4 space-y-4 text-body text-label-2">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {techs.length > 0 && (
            <>
              <h3 className="mt-8 text-title-3 text-label-1">{t.projects.techsTitle}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {techs.map((tech) => (
                  <li key={tech} className="chip">
                    {tech}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

export default function Projects() {
  const { t } = useLanguage();
  const items = t.projects.items ?? [];
  const featured = items.find((project) => project.featured) ?? items[0];
  const others = items.filter((project) => project !== featured);
  // Remember the id (not the object) so the open sheet follows a language switch; keep it after closing
  // so the sheet still has content while it animates out.
  const [sheet, setSheet] = useState({ open: false, id: null });
  const selected = items.find((project) => project.id === sheet.id) ?? null;

  const openDetails = (project) => setSheet({ open: true, id: project.id });
  const closeDetails = () => setSheet((current) => ({ ...current, open: false }));

  return (
    <Section id="projects" labelledBy="projects-title">
      <SectionHeader id="projects-title" eyebrow={t.projects.eyebrow} title={t.projects.title} />

      <div className="grid gap-grid">
        {featured && (
          <Motion.div {...reveal}>
            <ProjectCard project={featured} featured wide onDetails={() => openDetails(featured)} />
          </Motion.div>
        )}

        {others.length > 0 && (
          // Two columns from 640px (foldables and small tablets in portrait too), and on phones held sideways so
          // each visual fits the short screen.
          <ul className="grid gap-grid sm:grid-cols-2 max-sm:landscape:grid-cols-2">
            {others.map((project, index) => {
              // An odd count would leave an empty cell: the last card spans the row instead.
              const wide = others.length % 2 === 1 && index === others.length - 1;
              return (
                <Motion.li
                  key={project.id}
                  {...reveal}
                  className={wide ? 'sm:col-span-2 max-sm:landscape:col-span-2' : ''}
                >
                  <ProjectCard project={project} wide={wide} onDetails={() => openDetails(project)} />
                </Motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <ProjectSheet project={selected} open={sheet.open} onClose={closeDetails} />
    </Section>
  );
}
