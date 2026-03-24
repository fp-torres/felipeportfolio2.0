import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../context/LanguageContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr, isPt) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  const m = Math.floor(diff / 60);
  const h = Math.floor(diff / 3600);
  const d = Math.floor(diff / 86400);

  if (isPt) {
    if (d > 0) return `há ${d}d`;
    if (h > 0) return `há ${h}h`;
    return `há ${m}m`;
  } else {
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return `${m}m ago`;
  }
}

// ─── Article Card ────────────────────────────────────────────────────────────

function ArticleCard({ item, isPt }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col gap-2.5 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/25 transition-all duration-300"
    >
      {/* Tags row */}
      <div className="flex items-center gap-1.5 min-h-[20px]">
        {item.tag_list?.slice(0, 2).map(tag => (
          <span
            key={tag}
            className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/20 text-primary/60 bg-primary/5 leading-none"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Title — grows to fill space */}
      <p className="flex-1 text-[13px] font-medium text-gray-300 group-hover:text-white leading-snug transition-colors duration-200 line-clamp-3">
        {item.title}
      </p>

      {/* Footer: author + time */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          {item.user?.profile_image_90 ? (
            <img
              src={item.user.profile_image_90}
              alt={item.user.name}
              className="w-5 h-5 rounded-full ring-1 ring-white/10 object-cover shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-white/10 shrink-0" />
          )}
          <span className="text-[11px] text-gray-500 font-mono truncate">
            {item.user?.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-gray-600">
          <span className="text-[10px] font-mono">{timeAgo(item.published_at, isPt)}</span>
          <span className="text-white/10">·</span>
          <div className="flex items-center gap-1">
            <Icon icon="solar:clock-circle-linear" style={{ fontSize: 11 }} />
            <span className="text-[10px] font-mono">{item.reading_time_minutes}min</span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TechNews() {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";

  const [isOpen, setIsOpen] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const panelRef = useRef(null);

  // Fetch only when first opened
  useEffect(() => {
    if (!isOpen || fetched) return;
    setLoading(true);
    fetch('https://dev.to/api/articles?tag=programming&top=1&per_page=9')
      .then(res => res.json())
      .then(data => { setNews(data); setFetched(true); })
      .catch(err => console.error('TechNews fetch error:', err))
      .finally(() => setLoading(false));
  }, [isOpen, fetched]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const label = isPt ? 'TECH RADAR' : 'TECH RADAR';
  const panelTitle = isPt ? 'Radar de Tendências' : 'Trending in Tech';
  const panelSub = isPt
    ? 'Artigos em alta da comunidade dev'
    : 'Top reads from the dev community';
  const loadingText = isPt ? 'Sintonizando o sinal...' : 'Tuning the signal...';
  const emptyText = isPt ? 'Sem sinal no momento.' : 'No signal right now.';

  return (
    <>
      <style>{`
        @keyframes tn-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes tn-card-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tn-panel {
          animation: tn-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .tn-card {
          animation: tn-card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .tn-panel, .tn-card { animation: none; }
        }
      `}</style>

      {/* ── Trigger Button (lives inside the easter egg panel in Footer) ── */}
      {/* Export as a named export so Footer.jsx can render just the button */}
      {/* The panel is rendered via a portal-like fixed overlay */}

      {/* Trigger pill */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label={label}
        className={`
          relative flex items-center justify-center gap-2
          px-4 py-3 md:px-6 md:py-2.5
          rounded-xl md:rounded-full
          border transition-all duration-300
          ${isOpen
            ? 'text-primary border-primary/40 bg-primary/10'
            : 'text-gray-400 hover:text-white border-transparent hover:border-primary/30 hover:bg-primary/20'
          }
        `}
        title={isPt ? 'Ver tendências tech' : 'View tech trends'}
      >
        <Icon
          icon="solar:planet-bold-duotone"
          className={`text-xl md:text-2xl transition-transform duration-700 ${isOpen ? 'rotate-[30deg] text-primary' : 'text-primary'}`}
        />
        <span className="font-mono text-[10px] md:text-xs font-bold tracking-widest hidden sm:block">
          {label}
        </span>
        <span className="font-mono text-[10px] font-bold tracking-widest sm:hidden">RADAR</span>

        {/* Live dot */}
        {!isOpen && (
          <>
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          </>
        )}
      </button>

      {/* ── Slide-up Panel ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-end justify-center pointer-events-none"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setIsOpen(false)}
            style={{ background: 'rgba(0,0,0,0.55)' }}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            className="tn-panel relative pointer-events-auto w-full max-w-4xl flex flex-col rounded-t-3xl sm:rounded-t-3xl"
            style={{
              background: 'rgb(12, 12, 18)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              boxShadow: '0 -12px 60px rgba(0,0,0,0.7)',
              maxHeight: '85dvh',
            }}
          >
            {/* Swipe handle — top of panel, outside overflow */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Glow bar */}
            <div
              className="h-px w-full shrink-0"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(var(--primary-rgb),0.5) 50%, transparent 100%)' }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ background: 'rgba(var(--primary-rgb),0.12)', border: '1px solid rgba(var(--primary-rgb),0.2)' }}
                >
                  <Icon icon="solar:planet-bold-duotone" className="text-primary" style={{ fontSize: 18 }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white tracking-tight leading-tight">{panelTitle}</h3>
                  <p className="text-[10px] font-mono text-gray-500 tracking-wider truncate">{panelSub}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                {/* Live badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest hidden xs:block sm:block">
                    {isPt ? 'Ao vivo' : 'Live'}
                  </span>
                </div>

                {/* Close — explicit white icon, visible bg */}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label={isPt ? 'Fechar' : 'Close'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#e5e7eb',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 1L13 13M13 1L1 13"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Source tag */}
            <div className="px-4 sm:px-5 pt-3 pb-1 flex items-center gap-2 shrink-0">
              <Icon icon="simple-icons:devdotto" style={{ fontSize: 11, color: '#4b5563' }} />
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                {isPt ? 'Via DEV Community · top artigos' : 'Via DEV Community · top articles'}
              </span>
            </div>

            {/* Scrollable cards area */}
            <div className="overflow-y-auto px-4 sm:px-5 pt-2 pb-8 flex-1 min-h-0">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="relative w-9 h-9">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                  </div>
                  <p className="text-xs font-mono text-gray-500 tracking-widest">{loadingText}</p>
                </div>
              )}

              {!loading && news.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm font-mono text-gray-600">{emptyText}</p>
                </div>
              )}

              {!loading && news.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
                  {news.map((item, i) => (
                    <div
                      key={item.id}
                      className="tn-card"
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      <ArticleCard item={item} isPt={isPt} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}