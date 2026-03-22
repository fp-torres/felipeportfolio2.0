import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import WakaTime from './WakaTime';

// ─── Skill metadata ───────────────────────────────────────────────────────────
const SKILL_META = {
  'HTML5':         { color: '#E34F26', category: 'frontend',  icon: 'devicon-html5-plain'           },
  'CSS3':          { color: '#1572B6', category: 'frontend',  icon: 'devicon-css3-plain'            },
  'JavaScript':    { color: '#F7DF1E', category: 'frontend',  icon: 'devicon-javascript-plain'      },
  'TypeScript':    { color: '#3178C6', category: 'frontend',  icon: 'devicon-typescript-plain'      },
  'PHP':           { color: '#8892BE', category: 'backend',   icon: 'devicon-php-plain'             },
  'Python':        { color: '#3776AB', category: 'backend',   icon: 'devicon-python-plain'          },
  'Java':          { color: '#F89820', category: 'backend',   icon: 'devicon-java-plain'            },
  'Kotlin':        { color: '#7F52FF', category: 'mobile',    icon: 'devicon-kotlin-plain'          },
  'React':         { color: '#61DAFB', category: 'frontend',  icon: 'devicon-react-original'        },
  'Vite':          { color: '#646CFF', category: 'frontend',  icon: 'devicon-vite-original'         },
  'Vue.js':        { color: '#4FC08D', category: 'frontend',  icon: 'devicon-vuejs-plain'           },
  'Angular':       { color: '#DD0031', category: 'frontend',  icon: 'devicon-angularjs-plain'       },
  'Tailwind':      { color: '#06B6D4', category: 'frontend',  icon: 'devicon-tailwindcss-original'  },
  'Node.js':       { color: '#339933', category: 'backend',   icon: 'devicon-nodejs-plain'          },
  'Laravel':       { color: '#FF2D20', category: 'backend',   icon: 'devicon-laravel-plain'         },
  'Flet':          { color: '#3776AB', category: 'backend',   icon: 'devicon-python-plain'          },
  'MySQL':         { color: '#4479A1', category: 'database',  icon: 'devicon-mysql-plain'           },
  'PostgreSQL':    { color: '#336791', category: 'database',  icon: 'devicon-postgresql-plain'      },
  'Git':           { color: '#F05032', category: 'tools',     icon: 'devicon-git-plain'             },
  'GitHub':        { color: '#e8e8e8', category: 'tools',     icon: 'devicon-github-original'       },
  'Docker':        { color: '#2496ED', category: 'tools',     icon: 'devicon-docker-plain'          },
  'VS Code':       { color: '#007ACC', category: 'tools',     icon: 'devicon-vscode-plain'          },
  'Linux':         { color: '#FCC624', category: 'tools',     icon: 'devicon-linux-plain'           },
  'Windows':       { color: '#0078D4', category: 'tools',     icon: 'devicon-windows8-original'     },
  'MacOS':         { color: '#aaaaaa', category: 'tools',     icon: 'devicon-apple-original'        },
  'XAMPP':         { color: '#FB7A24', category: 'tools',     icon: 'devicon-apache-plain'          },
  'Hostinger':     { color: '#673DE6', category: 'tools',     icon: 'devicon-nginx-original'        },
  'Premiere':      { color: '#9999FF', category: 'extras',    icon: 'devicon-premierepro-plain'     },
  'After Effects': { color: '#CF96FD', category: 'extras',    icon: 'devicon-aftereffects-plain'    },
  'Figma':         { color: '#F24E1E', category: 'extras',    icon: 'devicon-figma-plain'           },
};

const ALL_SKILLS = Object.entries(SKILL_META).map(([name, meta]) => ({ name, ...meta }));

const CATEGORIES = [
  { key: 'all',      en: 'All',        pt: 'Todos'       },
  { key: 'frontend', en: 'Frontend',   pt: 'Frontend'    },
  { key: 'backend',  en: 'Backend',    pt: 'Backend'     },
  { key: 'database', en: 'Database',   pt: 'Database'    },
  { key: 'mobile',   en: 'Mobile',     pt: 'Mobile'      },
  { key: 'tools',    en: 'Tools',      pt: 'Ferramentas' },
  { key: 'extras',   en: 'Extras',     pt: 'Extras'      },
];

// How many cards to show collapsed on mobile
const MOBILE_INITIAL = 8;

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}

// ─── Skill Card ───────────────────────────────────────────────────────────────
function SkillCard({ name, color, icon, index, visible }) {
  const rgb = hexToRgb(color);
  const cardRef = useRef(null);

  // Magnetic / tilt effect on mouse move
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width  / 2);   // -1 … 1
    const dy   = (e.clientY - cy) / (rect.height / 2);   // -1 … 1
    card.style.transform = `perspective(500px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) scale(1.06) translateZ(4px)`;
    card.style.setProperty('--mx', `${(dx + 1) / 2 * 100}%`);
    card.style.setProperty('--my', `${(dy + 1) / 2 * 100}%`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0)';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="skill-card"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.94)',
        transition: `opacity .4s ease ${index * 30}ms, transform .45s cubic-bezier(.22,1,.36,1) ${index * 30}ms`,
        '--brand': color,
        '--rgb':   rgb,
        willChange: 'transform',
      }}
    >
      {/* Spotlight shimmer that follows the mouse */}
      <div className="skill-spotlight" />

      {/* Top accent line */}
      <div className="skill-accent-line" />

      {/* Icon – always full brand color */}
      <i
        className={`${icon} skill-icon`}
        style={{ color }}
      />

      {/* Name */}
      <span className="skill-name">{name}</span>

      {/* Full-width accent bar (no percentage, just brand color) */}
      <div className="skill-bar-track">
        <div className="skill-bar-fill" style={{ background: `linear-gradient(90deg, rgba(${rgb},.5), ${color})` }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Skills() {
  const { t, lang } = useLanguage();
  const isPt = lang === 'pt';

  const [activeCategory,    setActiveCategory]    = useState('all');
  const [displayedCategory, setDisplayedCategory] = useState('all');
  const [visible,           setVisible]           = useState(true);
  const [mobileExpanded,    setMobileExpanded]     = useState(false);
  const [isMobile,          setIsMobile]           = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Reset expansion when category changes
  const changeCategory = (cat) => {
    if (cat === activeCategory) return;
    setMobileExpanded(false);
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
      : ALL_SKILLS.filter(s => s.category === cat).length;

  const filtered =
    displayedCategory === 'all'
      ? ALL_SKILLS
      : ALL_SKILLS.filter(s => s.category === displayedCategory);

  const showSeeMore = isMobile && !mobileExpanded && filtered.length > MOBILE_INITIAL;
  const displayed   = showSeeMore ? filtered.slice(0, MOBILE_INITIAL) : filtered;

  const catLabel = displayedCategory !== 'all'
    ? ` · ${isPt
        ? CATEGORIES.find(c => c.key === displayedCategory)?.pt
        : CATEGORIES.find(c => c.key === displayedCategory)?.en}`
    : '';

  return (
    <>
      {/* ── Scoped styles injected once ── */}
      <style>{`
        .skill-card {
          position: relative;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.025);
          backdrop-filter: blur(10px);
          padding: 22px 12px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: default;
          transition:
            opacity .4s ease,
            transform .45s cubic-bezier(.22,1,.36,1),
            border-color .3s ease,
            box-shadow .3s ease,
            background .3s ease;
        }
        .skill-card:hover {
          border-color: rgba(var(--rgb), .5);
          background: linear-gradient(145deg, rgba(var(--rgb),.1) 0%, rgba(var(--rgb),.04) 100%);
          box-shadow:
            0 0 0 1px rgba(var(--rgb),.12),
            0 10px 36px rgba(var(--rgb),.2),
            inset 0 0 24px rgba(var(--rgb),.06);
        }

        /* Spotlight shimmer */
        .skill-spotlight {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: radial-gradient(
            circle at var(--mx, 50%) var(--my, 50%),
            rgba(var(--rgb), .18) 0%,
            transparent 55%
          );
          opacity: 0;
          transition: opacity .25s ease;
        }
        .skill-card:hover .skill-spotlight { opacity: 1; }

        /* Top accent line */
        .skill-accent-line {
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 2px;
          border-radius: 0 0 99px 99px;
          background: var(--brand);
          opacity: 0;
          transform: scaleX(0);
          transition: opacity .3s ease, transform .4s cubic-bezier(.22,1,.36,1);
        }
        .skill-card:hover .skill-accent-line {
          opacity: .85;
          transform: scaleX(1);
        }

        /* Icon */
        .skill-icon {
          font-size: 2.4rem;
          position: relative;
          z-index: 1;
          transition: filter .35s ease, transform .35s cubic-bezier(.34,1.56,.64,1);
        }
        .skill-card:hover .skill-icon {
          filter: drop-shadow(0 0 12px rgba(var(--rgb), .85));
          transform: scale(1.18) translateY(-3px);
        }

        /* Name */
        .skill-name {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .04em;
          color: #9ca3af;
          text-align: center;
          line-height: 1.3;
          position: relative;
          z-index: 1;
          transition: color .25s ease;
        }
        .skill-card:hover .skill-name { color: #ffffff; }

        /* Bar track */
        .skill-bar-track {
          width: 100%;
          height: 2px;
          background: rgba(255,255,255,.07);
          border-radius: 99px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        /* Bar fill – always full width, animates in on card hover */
        .skill-bar-fill {
          height: 100%;
          width: 0%;
          border-radius: 99px;
          box-shadow: 0 0 6px rgba(var(--rgb), .6);
          transition: width .7s cubic-bezier(.22,1,.36,1);
        }
        .skill-card:hover .skill-bar-fill { width: 100% !important; }

        /* Category tab hover */
        .cat-tab:hover:not(.cat-tab--active) {
          border-color: rgba(255,255,255,.28) !important;
          color: #ffffff !important;
        }
      `}</style>

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
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {CATEGORIES.map(({ key, en, pt }) => {
              const active = activeCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => changeCategory(key)}
                  className={`cat-tab${active ? ' cat-tab--active' : ''}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '7px 16px',
                    borderRadius: '99px',
                    border: active
                      ? '1px solid var(--color-primary, #f5c518)'
                      : '1px solid rgba(255,255,255,0.1)',
                    background: active
                      ? 'rgba(245,197,24,.12)'
                      : 'rgba(255,255,255,0.03)',
                    color: active ? 'var(--color-primary, #f5c518)' : '#9ca3af',
                    fontSize: '12px',
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    transition: 'all .2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isPt ? pt : en}
                  <span style={{
                    background: active ? 'var(--color-primary, #f5c518)' : 'rgba(255,255,255,.1)',
                    color: active ? '#000' : '#9ca3af',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '99px',
                    padding: '1px 6px',
                    transition: 'all .2s ease',
                  }}>
                    {count(key)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Count subtitle ── */}
          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(255,255,255,.22)',
            marginBottom: '28px',
            letterSpacing: '.05em',
            opacity: visible ? 1 : 0,
            transition: 'opacity .2s ease',
          }}>
            {filtered.length} {isPt ? 'tecnologias' : 'technologies'}{catLabel}
          </p>

          {/* ── Grid ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px',
          }}>
            {displayed.map((skill, i) => (
              <SkillCard
                key={skill.name}
                name={skill.name}
                color={skill.color}
                icon={skill.icon}
                index={i}
                visible={visible}
              />
            ))}
          </div>

          {/* ── See more / See less (mobile only) ── */}
          {isMobile && filtered.length > MOBILE_INITIAL && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setMobileExpanded(v => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 28px',
                  borderRadius: '99px',
                  border: '1px solid rgba(255,255,255,.18)',
                  background: 'rgba(255,255,255,.05)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '.04em',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all .2s ease',
                }}
              >
                {mobileExpanded
                  ? (isPt ? 'Ver menos' : 'See less')
                  : (isPt
                      ? `Ver mais ${filtered.length - MOBILE_INITIAL} tecnologias`
                      : `See ${filtered.length - MOBILE_INITIAL} more`)}
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transform: mobileExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}

        </div>
      </section>
    </>
  );
}