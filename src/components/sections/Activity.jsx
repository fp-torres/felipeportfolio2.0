import { useRef, useState } from 'react';
import { m as Motion } from 'framer-motion';
import { useLanguage } from '../../context/useLanguage';
import { useGithubData } from '../../hooks/useGithubData';
import { useNearViewport } from '../../hooks/useNearViewport';
import { DEFAULT_WAKATIME_RANGE, useWakaTime } from '../../hooks/useWakaTime';
import { reveal } from '../../lib/motion';
import Section from '../ui/Section';
import SectionHeader from '../ui/SectionHeader';
import { useHydrated } from '../activity/clientValues';
import { localeFor, statDuration } from '../activity/format';
import { StatTile } from '../activity/parts';
import GithubContributions from './GithubContributions';
import WakaTime from './WakaTime';

// A bridge without credentials will never answer: hide that block instead of showing a permanent error.
const isNotConfigured = (resource) => !resource.data && resource.error?.code === 'NOT_CONFIGURED';

// "Em números": GitHub + WakaTime on an elevated band (cards use surface-2).
// Phone: 2 stat tiles → heatmap → WakaTime. ≥1024: heatmap (8 cols) + stacked stats (4 cols), WakaTime full width.
export default function Activity() {
  const { t, lang } = useLanguage();
  const locale = localeFor(lang);
  const gridRef = useRef(null);
  const near = useNearViewport(gridRef); // the data is below the fold: fetch only when the visitor gets close
  const hydrated = useHydrated();
  const [range, setRange] = useState(DEFAULT_WAKATIME_RANGE);
  const github = useGithubData({ enabled: near });
  const waka = useWakaTime(range, { enabled: near });

  const githubOff = isNotConfigured(github);
  const wakaOff = isNotConfigured(waka);
  if (githubOff && wakaOff) return null;

  // Stat tiles (only when GitHub is available: otherwise the WakaTime card already shows its total).
  const tiles = [];
  if (!githubOff) {
    const githubData = hydrated ? github.data : undefined;
    if (githubData) {
      if (githubData.totalContributions !== null) {
        tiles.push(
          <StatTile
            key="contributions"
            value={new Intl.NumberFormat(locale).format(githubData.totalContributions)}
            label={t.activity.contributionsLabel}
          />,
        );
      }
    } else if (github.status !== 'error') {
      tiles.push(<StatTile key="contributions" loading />);
    }

    const wakaData = hydrated ? waka.data : undefined;
    const switching = Boolean(wakaData) && wakaData.range !== range;
    if (!wakaOff && wakaData && !(switching && waka.status === 'error')) {
      const coding = statDuration(wakaData.totalSeconds, locale);
      if (coding) {
        tiles.push(
          <StatTile
            key="coding"
            value={coding.value}
            unit={coding.unit}
            label={t.activity.codingLabel[wakaData.range]}
            reserve={Object.values(t.activity.codingLabel)}
            dimmed={switching}
          />,
        );
      }
    } else if (!wakaOff && !wakaData && waka.status !== 'error') {
      tiles.push(<StatTile key="coding" loading />);
    }
  }

  const pair = tiles.length > 1;

  return (
    <Section id="activity" band="elevated" labelledBy="activity-title">
      <SectionHeader id="activity-title" eyebrow={t.activity.eyebrow} title={t.activity.title} lede={t.activity.lede} />

      {/* Each block reveals on its own: a block that appears later (e.g. after "Try again") still fades in. */}
      <div ref={gridRef} className="grid grid-cols-1 gap-grid lg:grid-cols-12">
        {tiles.length > 0 && (
          <Motion.div
            {...reveal}
            className={`grid min-w-0 gap-grid lg:order-2 lg:col-span-4 lg:grid-cols-1 ${
              pair ? 'grid-cols-2 lg:grid-rows-2' : 'grid-cols-1'
            }`}
          >
            {tiles}
          </Motion.div>
        )}

        {!githubOff && (
          <Motion.div {...reveal} className={`min-w-0 ${tiles.length > 0 ? 'lg:order-1 lg:col-span-8' : 'lg:col-span-12'}`}>
            <GithubContributions enabled={near} />
          </Motion.div>
        )}

        {!wakaOff && (
          <Motion.div {...reveal} className="min-w-0 lg:order-3 lg:col-span-12">
            <WakaTime range={range} onRangeChange={setRange} enabled={near} />
          </Motion.div>
        )}
      </div>
    </Section>
  );
}
