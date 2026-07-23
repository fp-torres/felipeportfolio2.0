import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { motion as Motion } from 'framer-motion';
import { useLanguage } from '../../context/useLanguage';

const DEFAULT_RANGE = 'last_30_days';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 9000;
const CACHE_PREFIX = 'portfolio:wakatime:v2:';

const RANGES = [
  { value: 'last_7_days', pt: '7 dias', en: '7 days' },
  { value: 'last_30_days', pt: '30 dias', en: '30 days' },
  { value: 'all_time', pt: 'Histórico', en: 'All time' },
];

function getCachedStats(range) {
  try {
    const value = JSON.parse(localStorage.getItem(`${CACHE_PREFIX}${range}`));
    return Array.isArray(value?.languages) && value.languages.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function cacheStats(range, stats) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${range}`, JSON.stringify(stats));
  } catch {
    // The live view still works when storage is disabled or full.
  }
}

function formatUpdatedAt(value, isPt) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(isPt ? 'pt-BR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export default function WakaTime() {
  const { lang } = useLanguage();
  const isPt = lang === 'pt';
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [stats, setStats] = useState(() => getCachedStats(DEFAULT_RANGE));
  const [status, setStatus] = useState(stats ? 'cached' : 'loading');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = useCallback(async (selectedRange, signal) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const abortFromParent = () => controller.abort();
    signal.addEventListener('abort', abortFromParent, { once: true });

    try {
      const response = await fetch(
        `/wakatime.php?range=${encodeURIComponent(selectedRange)}`,
        {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        },
      );

      const payload = await response.json().catch(() => null);
      const nextStats = payload?.data;

      if (!response.ok || !Array.isArray(nextStats?.languages) || nextStats.languages.length === 0) {
        throw new Error(payload?.error || `WakaTime HTTP ${response.status}`);
      }

      return nextStats;
    } finally {
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', abortFromParent);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const cached = getCachedStats(range);

    if (cached) {
      setStats(cached);
      setStatus('cached');
      setRefreshing(true);
    } else {
      setStats(null);
      setStatus('loading');
    }

    fetchStats(range, controller.signal)
      .then((nextStats) => {
        if (controller.signal.aborted) return;
        setStats(nextStats);
        setStatus(nextStats.stale ? 'cached' : 'live');
        cacheStats(range, nextStats);
      })
      .catch((error) => {
        if (error.name === 'AbortError' || controller.signal.aborted) return;
        setStatus(cached ? 'cached' : 'error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setRefreshing(false);
      });

    return () => controller.abort();
  }, [fetchStats, range, refreshKey]);

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

  const updatedAt = useMemo(
    () => formatUpdatedAt(stats?.updatedAt, isPt),
    [isPt, stats?.updatedAt],
  );

  const statusView = {
    live: {
      dot: 'bg-emerald-400',
      text: isPt ? 'Dados atualizados' : 'Live data',
      badge: isPt ? 'AO VIVO' : 'LIVE',
      badgeClass: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/10',
    },
    cached: {
      dot: 'bg-amber-400',
      text: isPt ? 'Últimos dados disponíveis' : 'Last available data',
      badge: isPt ? 'CACHE' : 'CACHED',
      badgeClass: 'text-amber-300 border-amber-400/25 bg-amber-400/10',
    },
  }[status];

  if (status === 'loading' && !stats) {
    return (
      <div
        className="w-full max-w-4xl mx-auto bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 sm:p-8 min-h-48 shadow-xl"
        aria-busy="true"
        aria-label={isPt ? 'Carregando estatísticas do WakaTime' : 'Loading WakaTime statistics'}
      >
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-56 max-w-full bg-white/10 rounded-lg" />
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[80, 65, 48, 35].map((width) => (
                <div key={width} className="h-8 bg-white/5 rounded-lg" style={{ width: `${width}%` }} />
              ))}
            </div>
            <div className="min-h-32 bg-black/25 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error' && !stats) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-surface/40 rounded-2xl border border-red-400/20 p-6 sm:p-8 text-center shadow-xl">
        <Icon icon="solar:cloud-cross-bold-duotone" className="text-5xl text-red-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white">
          {isPt ? 'WakaTime indisponível no momento' : 'WakaTime is unavailable right now'}
        </h3>
        <p className="text-sm text-gray-400 mt-2 mb-5">
          {isPt
            ? 'A seção volta automaticamente quando o serviço responder. Você também pode tentar agora.'
            : 'This section recovers automatically when the service responds. You can also retry now.'}
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
      className="w-full max-w-4xl mx-auto bg-[#0a0f1d] rounded-2xl border border-white/10 p-5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5 mb-7">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Icon icon="solar:code-square-bold" className="text-primary shrink-0" />
              {isPt ? 'Atividade de Código' : 'Coding Activity'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusView?.dot}`} />
              <span>{statusView?.text}</span>
              {updatedAt && <span className="text-gray-600">· {updatedAt}</span>}
              {refreshing && <Icon icon="svg-spinners:ring-resize" className="text-primary" aria-label={isPt ? 'Atualizando' : 'Refreshing'} />}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={isPt ? 'Período das estatísticas' : 'Statistics period'}>
            {RANGES.map((item) => {
              const active = range === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRange(item.value)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${
                    active
                      ? 'border-primary/50 bg-primary/15 text-primary'
                      : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {isPt ? item.pt : item.en}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-[10px] font-mono font-bold tracking-widest ${statusView?.badgeClass}`}>
            {statusView?.badge}
          </span>
          {stats?.totalText && (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-gray-300">
              {isPt ? 'Total' : 'Total'}: <strong className="text-white">{stats.totalText}</strong>
            </span>
          )}
          {stats?.dailyAverageText && (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-gray-300">
              {isPt ? 'Média/dia' : 'Daily avg'}: <strong className="text-white">{stats.dailyAverageText}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 lg:gap-8 relative z-10">
        <div className="space-y-4">
          {stats?.languages.map((language) => (
            <div key={language.name}>
              <div className="flex justify-between items-end gap-4 mb-1.5">
                <span className="text-white font-bold truncate">{language.name}</span>
                <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                  {language.text || `${language.percent}%`}
                  <span className="text-gray-600 ml-2">({Number(language.percent).toFixed(1)}%)</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <Motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(Number(language.percent) || 0, 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: language.color || '#ffd100' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-black/50 border border-white/5 rounded-xl p-4 sm:p-5 font-mono text-xs sm:text-sm text-gray-400 flex flex-col justify-center shadow-inner min-h-44">
          <div className="flex gap-2 mb-4 border-b border-white/10 pb-3" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <p className="mb-2">
            <span className="text-primary">felipe@dev:~$</span> wakatime --range {range}
          </p>
          <p className="text-gray-300 mb-2">
            {isPt ? '> Linguagens mais usadas no período:' : '> Most used languages in this period:'}
          </p>
          <p className="text-white leading-relaxed">
            {stats?.languages.map((language) => language.name).join(' · ')}
          </p>
          {status === 'cached' && (
            <p className="text-amber-300/80 text-xs mt-4 leading-relaxed">
              {isPt
                ? '> A API oscilou; exibindo a última leitura válida, sem inventar números.'
                : '> The API is unstable; showing the last valid reading without fabricated numbers.'}
            </p>
          )}
        </div>
      </div>
    </Motion.div>
  );
}
