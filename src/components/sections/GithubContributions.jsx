import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { motion as Motion } from 'framer-motion';
import { useLanguage } from '../../context/useLanguage';

const GITHUB_LOGIN = 'fp-torres';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 9000;
const CACHE_KEY = 'portfolio:github-card:v1';

// Same green ramp GitHub itself uses on its dark theme calendar.
const LEVEL_COLORS = ['rgba(255,255,255,0.06)', '#0e4429', '#006d32', '#26a641', '#39d353'];
const LABELED_WEEKDAYS = [1, 3, 5]; // Mon, Wed, Fri

function getCachedData() {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY));
    return Array.isArray(value?.weeks) && value.weeks.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function cacheData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // The live view still works when storage is disabled or full.
  }
}

// Buckets raw counts into 5 levels (0 = none) using quartiles of the active days,
// the same way GitHub's own calendar scales its color intensity per user.
function buildLevelResolver(weeks) {
  const counts = weeks
    .flatMap((week) => week.days.map((day) => day.count))
    .filter((count) => count > 0)
    .sort((a, b) => a - b);

  if (counts.length === 0) return () => 0;

  const quantile = (p) => counts[Math.min(counts.length - 1, Math.floor(p * counts.length))];
  const q1 = quantile(0.25);
  const q2 = quantile(0.5);
  const q3 = quantile(0.75);

  return (count) => {
    if (count <= 0) return 0;
    if (count <= q1) return 1;
    if (count <= q2) return 2;
    if (count <= q3) return 3;
    return 4;
  };
}

function buildColumns(weeks) {
  return weeks.map((week) => {
    const column = Array(7).fill(null);
    week.days.forEach((day) => {
      column[day.weekday] = day;
    });
    return column;
  });
}

function buildMonthLabels(columns, locale) {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
  const labels = [];
  let lastMonth = null;

  columns.forEach((column, index) => {
    const days = column.filter(Boolean);
    if (days.length === 0) return;

    // The column's dominant month (not just its first day) avoids labeling a
    // one- or two-day sliver from the previous month at a week boundary.
    const counts = {};
    days.forEach((day) => {
      const month = day.date.slice(0, 7); // YYYY-MM
      counts[month] = (counts[month] || 0) + 1;
    });
    const month = Object.keys(counts).reduce((a, b) => (counts[a] >= counts[b] ? a : b));

    if (month !== lastMonth) {
      lastMonth = month;
      const sample = days.find((day) => day.date.startsWith(month));
      labels.push({ index, text: formatter.format(new Date(`${sample.date}T00:00:00`)) });
    }
  });

  return labels;
}

function StatBlock({ value, label, barColor, barWidth }) {
  return (
    <div className="flex-1 min-w-[120px]">
      <span className="text-3xl sm:text-4xl font-bold text-white block">{value}</span>
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
        <Motion.div initial={{ width: 0 }} whileInView={{ width: barWidth }} viewport={{ once: true }} className={`h-full ${barColor}`} />
      </div>
    </div>
  );
}

export default function GithubContributions() {
  const { lang } = useLanguage();
  const isPt = lang === 'pt';
  const locale = isPt ? 'pt-BR' : 'en-US';

  const [data, setData] = useState(() => getCachedData());
  const [status, setStatus] = useState(() => (getCachedData() ? 'cached' : 'loading'));
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async (signal) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const abortFromParent = () => controller.abort();
    signal.addEventListener('abort', abortFromParent, { once: true });

    try {
      const [profileResponse, contributionsResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${GITHUB_LOGIN}`, { signal: controller.signal }),
        fetch('/github.php', { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' }),
      ]);

      const contributionsPayload = await contributionsResponse.json().catch(() => null);
      const contributions = contributionsPayload?.data;

      if (!contributionsResponse.ok || !Array.isArray(contributions?.weeks) || contributions.weeks.length === 0) {
        throw new Error(contributionsPayload?.error || `GitHub HTTP ${contributionsResponse.status}`);
      }

      const profile = profileResponse.ok ? await profileResponse.json().catch(() => null) : null;

      return {
        totalContributions: contributions.totalContributions,
        weeks: contributions.weeks,
        stale: contributions.stale,
        repos: profile?.public_repos ?? 0,
        followers: profile?.followers ?? 0,
        htmlUrl: profile?.html_url || `https://github.com/${GITHUB_LOGIN}`,
      };
    } finally {
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', abortFromParent);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const cached = getCachedData();

    if (!cached) setStatus('loading');

    fetchData(controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setData(next);
        setStatus(next.stale ? 'cached' : 'live');
        cacheData(next);
      })
      .catch((error) => {
        if (error.name === 'AbortError' || controller.signal.aborted) return;
        setStatus(cached ? 'cached' : 'error');
      });

    return () => controller.abort();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        setRefreshKey((value) => value + 1);
      }
    };

    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    window.addEventListener('online', refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', refresh);
    };
  }, []);

  const columns = useMemo(() => (data ? buildColumns(data.weeks) : []), [data]);
  const monthLabels = useMemo(() => buildMonthLabels(columns, locale), [columns, locale]);
  const resolveLevel = useMemo(() => (data ? buildLevelResolver(data.weeks) : () => 0), [data]);

  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short' }), [locale]);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    [locale],
  );

  const tooltipFor = (day) => {
    const date = dateFormatter.format(new Date(`${day.date}T00:00:00`));
    if (day.count === 0) {
      return isPt ? `Nenhuma contribuição em ${date}` : `No contributions on ${date}`;
    }
    const label = isPt
      ? `${day.count} contribuiç${day.count === 1 ? 'ão' : 'ões'} em ${date}`
      : `${day.count} contribution${day.count === 1 ? '' : 's'} on ${date}`;
    return label;
  };

  if (status === 'loading' && !data) {
    return (
      <div
        className="w-full bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 p-5 sm:p-6 min-h-64 shadow-xl"
        aria-busy="true"
        aria-label={isPt ? 'Carregando dados do GitHub' : 'Loading GitHub data'}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 max-w-full bg-white/10 rounded-lg" />
          <div className="h-16 bg-black/25 rounded-xl" />
          <div className="h-28 bg-black/25 rounded-xl" />
        </div>
      </div>
    );
  }

  if (status === 'error' && !data) {
    return (
      <div className="w-full bg-surface/40 rounded-2xl border border-red-400/20 p-6 sm:p-8 text-center shadow-xl">
        <Icon icon="solar:cloud-cross-bold-duotone" className="text-4xl text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">
          {isPt ? 'GitHub indisponível no momento' : 'GitHub is unavailable right now'}
        </h3>
        <p className="text-sm text-gray-400 mt-2 mb-5">
          {isPt
            ? 'A seção volta automaticamente quando a API responder.'
            : 'This section recovers automatically once the API responds.'}
        </p>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-bold text-bg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Icon icon="solar:refresh-bold" />
          {isPt ? 'Tentar novamente' : 'Try again'}
        </button>
      </div>
    );
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      className="w-full bg-gradient-to-b from-surface/40 to-black/40 backdrop-blur-md rounded-3xl border border-white/10 p-5 sm:p-6 shadow-xl relative overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Icon icon="mdi:github" width="40" className="text-white shrink-0" />
          <h3 className="text-white font-bold text-lg leading-tight">GitHub</h3>
        </div>
        <a
          href={data.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs border border-white/20 px-3 py-1 rounded-full hover:bg-white hover:text-bg transition-colors text-white"
        >
          {isPt ? 'Ver Perfil GitHub' : 'View GitHub Profile'}
        </a>
      </div>

      <div className="flex flex-wrap gap-6 mb-6">
        <StatBlock value={data.repos} label={isPt ? 'Repositórios' : 'Repositories'} barColor="bg-primary" barWidth="70%" />
        <StatBlock value={data.followers} label={isPt ? 'Seguidores' : 'Followers'} barColor="bg-purple-500" barWidth="40%" />
      </div>

      <div className="pb-6 mb-6 border-b border-white/10">
        <p className="text-xs text-gray-500">{isPt ? 'Atividade Recente' : 'Recent Activity'}</p>
      </div>

      <h4 className="text-sm font-bold text-white mb-4">
        {isPt
          ? `${data.totalContributions} contribuições no último ano`
          : `${data.totalContributions} contributions in the last year`}
      </h4>

      <div className="overflow-x-auto pb-2 flex justify-center">
        <div className="flex flex-col gap-2 w-max">
          <div className="flex gap-2">
            <div className="flex flex-col gap-[3px] pt-[18px] shrink-0 text-[10px] text-gray-500 leading-none">
              {Array.from({ length: 7 }, (_, weekday) => (
                <span key={weekday} className="h-[11px] flex items-center">
                  {LABELED_WEEKDAYS.includes(weekday) ? weekdayFormatter.format(new Date(2024, 0, weekday)) : ''}
                </span>
              ))}
            </div>

            <div className="relative">
              <div className="flex gap-[3px] h-[14px] mb-1 text-[10px] text-gray-500 leading-none">
                {columns.map((_, index) => {
                  const label = monthLabels.find((entry) => entry.index === index);
                  return (
                    <span key={index} className="w-[11px] shrink-0 relative">
                      {label && <span className="absolute left-0 whitespace-nowrap">{label.text}</span>}
                    </span>
                  );
                })}
              </div>

              <div className="flex gap-[3px]">
                {columns.map((column, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-[3px]">
                    {column.map((day, rowIndex) =>
                      day ? (
                        <div
                          key={rowIndex}
                          title={tooltipFor(day)}
                          className="w-[11px] h-[11px] rounded-[2px] transition-transform hover:scale-125"
                          style={{ backgroundColor: LEVEL_COLORS[resolveLevel(day.count)] }}
                        />
                      ) : (
                        <div key={rowIndex} className="w-[11px] h-[11px]" />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-500">
            <span>{isPt ? 'Menos' : 'Less'}</span>
            {LEVEL_COLORS.map((color, index) => (
              <span key={index} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: color }} />
            ))}
            <span>{isPt ? 'Mais' : 'More'}</span>
          </div>
        </div>
      </div>

      {status === 'cached' && (
        <p className="text-amber-300/70 text-[11px] mt-3">
          {isPt
            ? 'A API do GitHub oscilou; exibindo a última leitura válida.'
            : 'The GitHub API is unstable; showing the last valid reading.'}
        </p>
      )}
    </Motion.div>
  );
}
