import { useState } from 'react';
import { AnimatePresence, m as Motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/useLanguage';
import { DUR, EASE, prefersReducedMotion, reveal } from '../../lib/motion';
import Section from '../ui/Section';
import SectionHeader from '../ui/SectionHeader';

// Monochrome logos, bundled offline by scripts/build-icons.mjs (names must stay full literals).
// `brand` tints the logo only on hover with a real pointer (hover variants are gated in tailwind.config.js);
// a few colours are lightened so they stay visible on the dark card.
const SKILLS = [
  { name: 'HTML5', category: 'frontend', icon: 'simple-icons:html5', brand: 'group-hover:text-[#e34f26]' },
  { name: 'CSS3', category: 'frontend', icon: 'devicon-plain:css3', brand: 'group-hover:text-[#2d8fd5]' },
  { name: 'JavaScript', category: 'frontend', icon: 'simple-icons:javascript', brand: 'group-hover:text-[#f7df1e]' },
  { name: 'TypeScript', category: 'frontend', icon: 'simple-icons:typescript', brand: 'group-hover:text-[#3178c6]' },
  { name: 'PHP', category: 'backend', icon: 'simple-icons:php', brand: 'group-hover:text-[#8892be]' },
  { name: 'Python', category: 'backend', icon: 'simple-icons:python', brand: 'group-hover:text-[#4b8bbe]' },
  { name: 'Java', category: 'backend', icon: 'devicon-plain:java', brand: 'group-hover:text-[#f89820]' },
  { name: 'Kotlin', category: 'mobile', icon: 'simple-icons:kotlin', brand: 'group-hover:text-[#7f52ff]' },
  { name: 'React', category: 'frontend', icon: 'simple-icons:react', brand: 'group-hover:text-[#61dafb]' },
  { name: 'Vite', category: 'frontend', icon: 'devicon-plain:vitejs', brand: 'group-hover:text-[#646cff]' },
  { name: 'Vue.js', category: 'frontend', icon: 'simple-icons:vuedotjs', brand: 'group-hover:text-[#4fc08d]' },
  { name: 'Angular', category: 'frontend', icon: 'simple-icons:angular', brand: 'group-hover:text-[#dd0031]' },
  { name: 'Tailwind', category: 'frontend', icon: 'simple-icons:tailwindcss', brand: 'group-hover:text-[#06b6d4]' },
  { name: 'Node.js', category: 'backend', icon: 'simple-icons:nodedotjs', brand: 'group-hover:text-[#5fa04e]' },
  { name: 'Laravel', category: 'backend', icon: 'simple-icons:laravel', brand: 'group-hover:text-[#ff2d20]' },
  { name: 'Flet', category: 'backend', icon: 'simple-icons:flutter', brand: 'group-hover:text-[#54c5f8]' },
  { name: 'MySQL', category: 'database', icon: 'devicon-plain:mysql', brand: 'group-hover:text-[#4479a1]' },
  { name: 'PostgreSQL', category: 'database', icon: 'simple-icons:postgresql', brand: 'group-hover:text-[#4169e1]' },
  { name: 'Git', category: 'tools', icon: 'simple-icons:git', brand: 'group-hover:text-[#f05032]' },
  { name: 'GitHub', category: 'tools', icon: 'simple-icons:github', brand: 'group-hover:text-label-1' },
  { name: 'Docker', category: 'tools', icon: 'simple-icons:docker', brand: 'group-hover:text-[#2496ed]' },
  { name: 'VS Code', category: 'tools', icon: 'devicon-plain:vscode', brand: 'group-hover:text-[#007acc]' },
  { name: 'Linux', category: 'tools', icon: 'simple-icons:linux', brand: 'group-hover:text-[#fcc624]' },
  { name: 'Windows', category: 'tools', icon: 'simple-icons:windows', brand: 'group-hover:text-[#0078d4]' },
  { name: 'MacOS', category: 'tools', icon: 'simple-icons:apple', brand: 'group-hover:text-label-1' },
  { name: 'XAMPP', category: 'tools', icon: 'simple-icons:xampp', brand: 'group-hover:text-[#fb7a24]' },
  { name: 'Hostinger', category: 'tools', icon: 'simple-icons:hostinger', brand: 'group-hover:text-[#8c6bf0]' },
  { name: 'Premiere', category: 'extras', icon: 'devicon-plain:premierepro', brand: 'group-hover:text-[#9999ff]' },
  { name: 'After Effects', category: 'extras', icon: 'devicon-plain:aftereffects', brand: 'group-hover:text-[#cf96fd]' },
  { name: 'Figma', category: 'extras', icon: 'simple-icons:figma', brand: 'group-hover:text-[#f24e1e]' },
];

const COUNTS = Object.fromEntries(
  ['all', 'frontend', 'backend', 'database', 'mobile', 'tools', 'extras'].map((key) => [
    key,
    key === 'all' ? SKILLS.length : SKILLS.filter((skill) => skill.category === key).length,
  ]),
);

// A filter only exists while it has something to show: no chip can ever lead to an empty card.
const CATEGORIES = Object.keys(COUNTS).filter((key) => COUNTS[key] > 0);

const gridFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DUR.fast, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: EASE.exit } },
};

export default function Skills() {
  const { t } = useLanguage();
  const [category, setCategory] = useState('all');
  const visible = category === 'all' ? SKILLS : SKILLS.filter((skill) => skill.category === category);
  const countLabel = (n) => t.skills.countLabel.replace('{n}', n);

  const select = (key, event) => {
    setCategory(key);
    // On phones the filters scroll sideways: bring a half-hidden chip fully into view.
    event.currentTarget.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  };

  return (
    <Section id="skills" labelledBy="skills-title">
      <SectionHeader
        id="skills-title"
        eyebrow={t.skills.eyebrow}
        title={t.skills.title}
        lede={countLabel(SKILLS.length)}
      />

      {/* One sideways-scrolling row on touch screens (no orphan chip on a second line); wraps from 768px
          with a mouse, which can't swipe, and for everyone from 1024px, where all filters fit one row. */}
      <div
        role="group"
        aria-label={t.skills.filterLabel}
        className="scroll-row snap-none gap-2 py-1.5 can-hover:md:mx-0 can-hover:md:flex-wrap can-hover:md:overflow-visible can-hover:md:px-0 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
      >
        {CATEGORIES.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={category === key}
            onClick={(event) => select(key, event)}
            className="chip-toggle group"
          >
            {t.skills.categories[key]}
            <span className="tabular-nums text-label-3 group-aria-pressed:text-bg/60">{COUNTS[key]}</span>
          </button>
        ))}
      </div>

      <Motion.div {...reveal} className="mt-4 rounded-card bg-surface-1 px-2 py-6 xs:px-4 sm:mt-6 sm:p-card">
        <AnimatePresence mode="wait" initial={false}>
          <Motion.ul
            key={category}
            {...gridFade}
            className="grid grid-cols-3 gap-y-6 min-[360px]:grid-cols-4 sm:grid-cols-6 sm:gap-x-2 lg:grid-cols-8 lg:gap-y-8"
          >
            {visible.map((skill) => (
              <li key={skill.name} className="group flex min-w-0 flex-col items-center gap-2 text-center">
                {/* Fixed-size box: the pre-rendered page reserves the logo's space, so nothing shifts when
                    the SVG mounts (inlining 30 SVGs in the HTML would weigh ~40 KB for a below-the-fold grid). */}
                <span
                  aria-hidden="true"
                  className={`grid size-7 place-items-center text-label-1/85 transition-colors duration-base ease-standard sm:size-8 ${skill.brand}`}
                >
                  <Icon icon={skill.icon} className="size-full" />
                </span>
                <span className="max-w-full break-words text-footnote text-label-2 transition-colors duration-base ease-standard group-hover:text-label-1">
                  {skill.name}
                </span>
              </li>
            ))}
          </Motion.ul>
        </AnimatePresence>
      </Motion.div>

      <p className="sr-only" aria-live="polite">
        {countLabel(visible.length)}
      </p>
    </Section>
  );
}
