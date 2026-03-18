import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import WakaTime from './WakaTime';

// ─── Brand colors + category + proficiency ─────────────────────────────────
const SKILL_META = {
  // Languages
  'HTML5':           { color: '#E34F26', category: 'frontend',  level: 95, icon: 'devicon-html5-plain'            },
  'CSS3':            { color: '#1572B6', category: 'frontend',  level: 90, icon: 'devicon-css3-plain'             },
  'JavaScript':      { color: '#F7DF1E', category: 'frontend',  level: 95, icon: 'devicon-javascript-plain'       },
  'TypeScript':      { color: '#3178C6', category: 'frontend',  level: 78, icon: 'devicon-typescript-plain'       },
  'PHP':             { color: '#8892BE', category: 'backend',   level: 78, icon: 'devicon-php-plain'              },
  'Python':          { color: '#3776AB', category: 'backend',   level: 68, icon: 'devicon-python-plain'           },
  'Java':            { color: '#F89820', category: 'backend',   level: 60, icon: 'devicon-java-plain'             },
  'Kotlin':          { color: '#7F52FF', category: 'mobile',    level: 50, icon: 'devicon-kotlin-plain'           },

  // Front-end
  'React':           { color: '#61DAFB', category: 'frontend',  level: 90, icon: 'devicon-react-original'         },
  'Vite':            { color: '#646CFF', category: 'frontend',  level: 85, icon: 'devicon-vite-original'          },
  'Vue.js':          { color: '#4FC08D', category: 'frontend',  level: 62, icon: 'devicon-vuejs-plain'            },
  'Angular':         { color: '#DD0031', category: 'frontend',  level: 55, icon: 'devicon-angularjs-plain'        },
  'Tailwind':        { color: '#06B6D4', category: 'frontend',  level: 88, icon: 'devicon-tailwindcss-original'   },

  // Back-end / Frameworks
  'Node.js':         { color: '#339933', category: 'backend',   level: 80, icon: 'devicon-nodejs-plain'           },
  'Laravel':         { color: '#FF2D20', category: 'backend',   level: 68, icon: 'devicon-laravel-plain'          },
  'Flet':            { color: '#3776AB', category: 'backend',   level: 60, icon: 'devicon-python-plain'           },

  // Database / Dados
  'MySQL':           { color: '#4479A1', category: 'database',  level: 78, icon: 'devicon-mysql-plain'            },
  'PostgreSQL':      { color: '#336791', category: 'database',  level: 55, icon: 'devicon-postgresql-plain'       },

  // Tools / DevOps
  'Git':             { color: '#F05032', category: 'tools',     level: 92, icon: 'devicon-git-plain'              },
  'GitHub':          { color: '#e8e8e8', category: 'tools',     level: 90, icon: 'devicon-github-original'        },
  'Docker':          { color: '#2496ED', category: 'tools',     level: 70, icon: 'devicon-docker-plain'           },
  'VS Code':         { color: '#007ACC', category: 'tools',     level: 95, icon: 'devicon-vscode-plain'           },
  'Linux':           { color: '#FCC624', category: 'tools',     level: 80, icon: 'devicon-linux-plain'            },
  'Windows':         { color: '#0078D4', category: 'tools',     level: 85, icon: 'devicon-windows8-original'      },
  'MacOS':           { color: '#aaaaaa', category: 'tools',     level: 75, icon: 'devicon-apple-original'         },
  'XAMPP':           { color: '#FB7A24', category: 'tools',     level: 75, icon: 'devicon-apache-plain'           },
  'Hostinger':       { color: '#673DE6', category: 'tools',     level: 72, icon: 'devicon-nginx-original'         },

  // Extras / Criativo
  'Premiere':        { color: '#9999FF', category: 'extras',    level: 78, icon: 'devicon-premierepro-plain'      },
  'After Effects':   { color: '#CF96FD', category: 'extras',    level: 70, icon: 'devicon-aftereffects-plain'     },
  'Figma':           { color: '#F24E1E', category: 'extras',    level: 65, icon: 'devicon-figma-plain'            },
};

// ─── Skills list (merging base data with SKILL_META) ────────────────────────
// We rebuild from SKILL_META so it's self-contained regardless of t.skills.list order
const ALL_SKILLS = Object.entries(SKILL_META).map(([name, meta]) => ({
  name,
  icon: meta.icon,
}));

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',      en: 'All',      pt: 'Todos'    },
  { key: 'frontend', en: 'Frontend', pt: 'Frontend' },
  { key: 'backend',  en: 'Backend',  pt: 'Backend'  },
  { key: 'database', en: 'Database', pt: 'Database' },
  { key: 'mobile',   en: 'Mobile',   pt: 'Mobile'   },
  { key: 'tools',    en: 'Tools',    pt: 'Ferramentas' },
  { key: 'extras',   en: 'Extras',   pt: 'Extras'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255';
}

// ─── Skill Card ───────────────────────────────────────────────────────────────
function SkillCard({ name, icon, index, visible }) {
  const meta  = SKILL_META[name] || { color: '#888', level: 60 };
  const rgb   = hexToRgb(meta.color);

  const [hovered,     setHovered]     = useState(false);
  const [barAnimated, setBarAnimated] = useState(false);

  useEffect(() => {
    let t;
    if (hovered) t = setTimeout(() => setBarAnimated(true), 40);
    else setBarAnimated(false);
    return () => clearTimeout(t);
  }, [hovered]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        // staggered entrance
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
        transition: `opacity .4s ease ${index * 35}ms, transform .4s cubic-bezier(.22,1,.36,1) ${index * 35}ms`,

        // card surface
        background: hovered
          ? `linear-gradient(145deg, rgba(${rgb},.1) 0%, rgba(${rgb},.04) 100%)`
          : 'rgba(255,255,255,0.025)',
        border: hovered
          ? `1px solid rgba(${rgb},.55)`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: hovered
          ? `0 0 0 1px rgba(${rgb},.15), 0 8px 32px rgba(${rgb},.18), inset 0 0 20px rgba(${rgb},.06)`
          : '0 2px 6px rgba(0,0,0,.25)',
        borderRadius: '14px',
        padding: '22px 12px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        cursor: 'default',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Radial glow blob */}
      <div style={{
        position: 'absolute',
        top: '-30%', left: '50%',
        transform: 'translateX(-50%)',
        width: '120px', height: '120px',
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},${hovered ? .22 : .05}) 0%, transparent 65%)`,
        transition: 'background .45s ease',
        pointerEvents: 'none',
      }} />

      {/* Icon — neutral → brand color on hover */}
      <i
        className={`${icon} text-4xl`}
        style={{
          color: hovered ? meta.color : '#6b7280',
          filter: hovered ? `drop-shadow(0 0 10px rgba(${rgb},.75))` : 'none',
          transition: 'color .3s ease, filter .3s ease',
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Name */}
      <span style={{
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '.04em',
        color: hovered ? '#ffffff' : '#9ca3af',
        transition: 'color .3s ease',
        textAlign: 'center',
        lineHeight: 1.3,
        position: 'relative',
        zIndex: 1,
      }}>
        {name}
      </span>

      {/* Proficiency bar */}
      <div style={{
        width: '100%', height: '3px',
        background: 'rgba(255,255,255,0.07)',
        borderRadius: '99px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          height: '100%',
          width: barAnimated ? `${meta.level}%` : '0%',
          background: `linear-gradient(90deg, rgba(${rgb},.6), ${meta.color})`,
          borderRadius: '99px',
          boxShadow: `0 0 8px rgba(${rgb},.6)`,
          transition: 'width .75s cubic-bezier(.22,1,.36,1)',
        }} />
      </div>

      {/* Proficiency % label — only on hover */}
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        color: meta.color,
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity .25s ease, transform .25s ease',
        letterSpacing: '.06em',
        position: 'relative',
        zIndex: 1,
      }}>
        {meta.level}%
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Skills() {
  const { t, language } = useLanguage();
  const isPt = language === 'pt';

  const [activeCategory, setActiveCategory]     = useState('all');
  const [displayedCategory, setDisplayedCategory] = useState('all');
  const [visible, setVisible]                   = useState(true);

  const changeCategory = (cat) => {
    if (cat === activeCategory) return;
    setVisible(false);
    setTimeout(() => {
      setActiveCategory(cat);
      setDisplayedCategory(cat);
      setVisible(true);
    }, 200);
  };

  const count = (cat) =>
    cat === 'all'
      ? ALL_SKILLS.length
      : ALL_SKILLS.filter(s => (SKILL_META[s.name]?.category || '') === cat).length;

  const filtered =
    displayedCategory === 'all'
      ? ALL_SKILLS
      : ALL_SKILLS.filter(s => (SKILL_META[s.name]?.category || '') === displayedCategory);

  return (
    <section id="skills" className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Title ── */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
          <span className="border-b-4 border-primary pb-2">{t.skills.title}</span>
        </h2>

        {/* ── WakaTime ── */}
        <div className="mb-16">
          <WakaTime />
        </div>

        {/* ── Category Tabs ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          justifyContent: 'center', marginBottom: '36px',
        }}>
          {CATEGORIES.map(({ key, en, pt }) => {
            const active = activeCategory === key;
            const n = count(key);
            return (
              <button
                key={key}
                onClick={() => changeCategory(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 16px',
                  borderRadius: '99px',
                  border: active
                    ? '1px solid var(--color-primary, #f5c518)'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(245,197,24,.12)' : 'rgba(255,255,255,0.03)',
                  color: active ? 'var(--color-primary, #f5c518)' : '#9ca3af',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all .2s ease',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.28)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                {isPt ? pt : en}
                <span style={{
                  background: active ? 'var(--color-primary, #f5c518)' : 'rgba(255,255,255,.1)',
                  color: active ? '#000' : '#9ca3af',
                  fontSize: '10px', fontWeight: 700,
                  borderRadius: '99px',
                  padding: '1px 6px',
                  transition: 'all .2s ease',
                }}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Subtitle count ── */}
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgba(255,255,255,.22)',
          marginBottom: '28px',
          letterSpacing: '.05em',
          opacity: visible ? 1 : 0,
          transition: 'opacity .2s ease',
        }}>
          {filtered.length}{' '}
          {isPt ? 'tecnologias' : 'technologies'}
          {displayedCategory !== 'all'
            ? ` · ${isPt
                ? CATEGORIES.find(c => c.key === displayedCategory)?.pt
                : CATEGORIES.find(c => c.key === displayedCategory)?.en}`
            : ''}
        </p>

        {/* ── Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '14px',
        }}>
          {filtered.map((skill, i) => (
            <SkillCard
              key={skill.name}
              name={skill.name}
              icon={skill.icon}
              index={i}
              visible={visible}
            />
          ))}
        </div>

      </div>
    </section>
  );
}