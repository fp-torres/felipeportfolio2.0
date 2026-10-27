import { m as Motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { reveal } from '../../lib/motion';
import Section from '../ui/Section';
import SectionHeader from '../ui/SectionHeader';

// Company / school logos (200×200 squares with their own background, shown like app icons).
// 132px WebP = the 44px logo at 3x.
import logoCrase from '../../assets/imgs/crase_sigma_logo.jpg?w=132&format=webp&quality=82';
import logoAllternativa from '../../assets/imgs/allternativa_filmes_x_logo.jpg?w=132&format=webp&quality=82';
import logoUva from '../../assets/imgs/uva_logo.jpg?w=132&format=webp&quality=82';
import logoSantoInacio from '../../assets/imgs/santoinaciorj_logo.jpg?w=132&format=webp&quality=82';

function companyLogo(name) {
  const key = name.toLowerCase();
  if (key.includes('crase')) return logoCrase;
  if (key.includes('allternativa')) return logoAllternativa;
  return null;
}

function schoolLogo(name) {
  const key = name.toLowerCase();
  if (key.includes('veiga') || key.includes('uva')) return logoUva;
  if (key.includes('inácio')) return logoSantoInacio;
  return null;
}

// "01/2026 - Atual" → { start: '01/2026', end: 'Atual' } (null when the period is not a range).
function splitPeriod(period) {
  const parts = period.split(/\s+[-–—]\s+/);
  return parts.length === 2 ? { start: parts[0], end: parts[1] } : null;
}

// One date style for every period: "01/2026" reads "Jan 2026", like "Abr 2023" next to it. A date never splits
// across lines (no-break space). Month names come from the dictionary (no Intl), so the server and the browser
// render the same text.
const MONTH_YEAR = /^(\d{1,2})\/(\d{4})$/;

function formatDate(value, months) {
  const match = MONTH_YEAR.exec(value.trim());
  const month = match && months?.[Number(match[1]) - 1];
  return (month ? `${month} ${match[2]}` : value).replace(/ /g, '\u00a0');
}

// Website + LinkedIn of a company or school, in the same order on every row. `about` names the organisation
// for screen readers ("Site: Crase Sigma (abre em nova aba)").
function orgLinks(entry, about, t) {
  return [
    entry.website && { key: 'website', label: t.experience.links.website, href: entry.website, about },
    entry.linkedin && { key: 'linkedin', label: t.experience.links.linkedin, href: entry.linkedin, about },
  ].filter(Boolean);
}

export default function Experience() {
  const { t } = useLanguage();

  const work = t.experience.items.map((job) => ({
    key: `job-${job.id}`,
    title: job.role,
    org: job.company,
    period: job.period,
    current: Boolean(job.current),
    description: job.description,
    links: orgLinks(job, job.company, t),
    logo: companyLogo(job.company),
    fallbackIcon: 'solar:case-minimalistic-linear',
  }));

  const education = t.experience.education.map((edu) => ({
    key: `edu-${edu.id}`,
    title: edu.course,
    org: edu.school,
    period: edu.period,
    description: edu.description,
    links: [
      ...orgLinks(edu, edu.school, t),
      ...(edu.diploma ? [{ key: 'diploma', label: t.experience.diploma, href: edu.diploma, about: edu.course }] : []),
    ],
    logo: schoolLogo(edu.school),
    fallbackIcon: 'solar:square-academic-cap-linear',
  }));

  return (
    <Section id="experience" labelledBy="experience-title">
      <SectionHeader id="experience-title" eyebrow={t.experience.eyebrow} title={t.experience.title} />

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-grid">
        <Group id="experience-work-title" title={t.experience.experienceTitle} rows={work} />
        <Group id="experience-education-title" title={t.experience.educationTitle} rows={education} />
      </div>
    </Section>
  );
}

// One titled group = one grouped-list card (inset hairlines between rows, like iOS Settings).
function Group({ id, title, rows }) {
  return (
    <Motion.div {...reveal}>
      <h3 id={id} className="mb-4 text-title-2 text-label-1 sm:mb-5">
        {title}
      </h3>
      <ul role="list" aria-labelledby={id} className="divide-y divide-separator/10 rounded-card bg-surface-1 px-card">
        {rows.map((row) => (
          <Row key={row.key} row={row} />
        ))}
      </ul>
    </Motion.div>
  );
}

// Logo + title block side by side; below them the description and the diploma link use the whole row on
// phones (like the App Store's update notes), so a 320px screen still gets ~30 characters per line.
// From 640px they line up with the title instead.
function Row({ row }) {
  const { t } = useLanguage();

  return (
    <li className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 py-card sm:gap-x-4">
      {row.logo ? (
        <img
          src={row.logo}
          alt=""
          width="44"
          height="44"
          loading="lazy"
          decoding="async"
          className="size-11 rounded-control object-cover ring-1 ring-white/10"
        />
      ) : (
        <span aria-hidden="true" className="grid size-11 place-items-center rounded-control bg-surface-2 text-label-2">
          <Icon icon={row.fallbackIcon} className="size-[22px]" />
        </span>
      )}

      <div className="min-w-0">
        <h4 className="text-title-3 text-label-1">{row.title}</h4>
        <p className="mt-1 text-callout tabular-nums text-label-2">
          {row.org}
          {/* No-break space: when the line wraps, the "·" stays with the name instead of starting the next line. */}
          <span aria-hidden="true">{'\u00a0· '}</span>
          <span className="sr-only">, </span>
          <Period period={row.period} current={row.current} />
        </p>
      </div>

      {row.description && (
        <p className="col-span-2 mt-3 max-w-reading text-callout text-label-2 sm:col-span-1 sm:col-start-2">
          {row.description}
        </p>
      )}

      {row.links.length > 0 && (
        <ul role="list" className="col-span-2 -mb-2.5 mt-1 flex flex-wrap gap-x-6 sm:col-span-1 sm:col-start-2">
          {row.links.map((link) => (
            <li key={link.key}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.label}: ${link.about} (${t.ui.opensInNewTab})`}
                className="text-link min-w-tap text-callout"
              >
                {link.label}
                <span aria-hidden="true" className="text-[1.1em] leading-none">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// Date range with an en dash; for the current role the open end carries the one static "● Atual" status.
// One line from 300px. Narrower screens (e.g. the first Galaxy Fold's cover, where "Abr 2023 – Jul 2023" is wider
// than the column) may wrap it, but only after the dash: the dates keep their no-break spaces, the dash stays with
// the start date and the status dot with its label.
function Period({ period, current }) {
  const { t } = useLanguage();
  const months = t.experience.months;
  const range = splitPeriod(period);

  if (!range) {
    return (
      <span className="whitespace-nowrap max-[299px]:whitespace-normal">
        {formatDate(period, months)}
        {current && <CurrentStatus label={t.experience.current} separator />}
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap max-[299px]:whitespace-normal">
      {`${formatDate(range.start, months)}\u00a0– `}
      {current ? <CurrentStatus label={range.end} /> : formatDate(range.end, months)}
    </span>
  );
}

function CurrentStatus({ label, separator = false }) {
  return (
    <>
      {separator && '\u00a0· '}
      <span className="whitespace-nowrap text-label-1">
        <span aria-hidden="true" className="status-dot mr-1.5 align-middle" />
        {label}
      </span>
    </>
  );
}
