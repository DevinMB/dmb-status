import { useState } from 'react';
import { useMetrics } from './hooks/useMetrics.js';
import { useSummary } from './hooks/useSummary.js';
import LoadingScreen from './components/LoadingScreen.jsx';
import ProfileCard from './components/ProfileCard.jsx';
import WellnessCard from './components/WellnessCard.jsx';
import MetricCard from './components/MetricCard.jsx';
import TrendsView from './components/TrendsView.jsx';

const VITALS = [
  { key: 'heart_rate',               label: 'Heart Rate',    icon: '♥' },
  { key: 'resting_heart_rate',        label: 'Resting HR',    icon: '💤' },
  { key: 'heart_rate_variability',    label: 'HRV',           icon: '📊' },
  { key: 'oxygen_saturation',         label: 'O₂ Sat',        icon: '🫁' },
  { key: 'respiratory_rate',          label: 'Resp Rate',     icon: '💨' },
  { key: 'systolic_blood_pressure',   label: 'Systolic BP',   icon: '🩸' },
  { key: 'diastolic_blood_pressure',  label: 'Diastolic BP',  icon: '🩸' },
  { key: 'blood_glucose',             label: 'Blood Glucose', icon: '🍬' },
];

const ACTIVITY = [
  { key: 'daily_steps',            label: 'Steps',       icon: '👣' },
  { key: 'daily_distance',         label: 'Distance',    icon: '📏' },
  { key: 'daily_floors',           label: 'Floors',      icon: '🏔️' },
  { key: 'active_calories_burned', label: 'Active Cals', icon: '🔥' },
  { key: 'total_calories_burned',  label: 'Total Cals',  icon: '⚡' },
  { key: 'vo2_max',                label: 'VO₂ Max',     icon: '💪' },
];

const BODY = [
  { key: 'weight',   label: 'Weight',   icon: '⚖️' },
  { key: 'body_fat', label: 'Body Fat', icon: '📉' },
];

const SLEEP = [
  { key: 'sleep_total_hours', label: 'Sleep Total', icon: '😴' },
  { key: 'sleep_confidence',  label: 'Current Sleep Confidence',  icon: '🌙' },
];

function isToday(isoString) {
  if (!isoString) return false;
  const fmt = (d) => d.toLocaleDateString('en-US', { timeZone: 'America/Detroit' });
  return fmt(new Date(isoString)) === fmt(new Date());
}

function hasCurrentData(metric) {
  return metric?.state != null && isToday(metric?.last_updated);
}

function Section({ title, icon, metrics, data, trends, hideIfEmpty = false }) {
  const [showHidden, setShowHidden] = useState(false);

  const visible = metrics.filter((m) =>  hasCurrentData(data?.[m.key]));
  const hidden  = metrics.filter((m) => !hasCurrentData(data?.[m.key]));

  if (hideIfEmpty && visible.length === 0) return null;

  return (
    <div className="section-panel">
      <div className="section-header">
        {icon} {title}
        <span className="count">{visible.length}/{metrics.length}</span>
      </div>
      <div className="section-body">
        {visible.map(({ key, label, icon: ic }) => (
          <MetricCard
            key={key}
            metricKey={key}
            label={label}
            icon={ic}
            metric={data?.[key]}
            trend={trends?.[key]}
          />
        ))}

        {hidden.length > 0 && (
          <button className="hidden-toggle" onClick={() => setShowHidden((s) => !s)}>
            {showHidden ? '▲' : '▶'} {hidden.length} metric{hidden.length > 1 ? 's' : ''} with no data
          </button>
        )}

        {showHidden && hidden.map(({ key, label, icon: ic }) => (
          <MetricCard key={key} metricKey={key} label={label} icon={ic} metric={null} chartable={false} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { data, error, loading, lastRefresh, refreshing, refresh } = useMetrics();
  const summary = useSummary(7);
  const [tab, setTab] = useState('overview');

  if (loading) return <LoadingScreen />;

  const isStale = !!error;

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-title">
            <span className="mark">✦</span> Devin — Health
          </div>

          <div className="tabbar">
            <button className={`tab-btn${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
            <button className={`tab-btn${tab === 'trends' ? ' active' : ''}`} onClick={() => setTab('trends')}>Trends</button>
          </div>

          <div className="topbar-right">
            <div className="topbar-meta">
              <span className={`status-dot${isStale ? ' stale' : ''}`} />
              {lastRefresh
                ? lastRefresh.toLocaleTimeString('en-US', { timeZone: 'America/Detroit', hour12: true })
                : '—'}
            </div>
            <button
              className={`icon-btn${refreshing ? ' spinning' : ''}`}
              onClick={refresh}
              title="Refresh now"
              aria-label="Refresh now"
            >
              ↺
            </button>
          </div>
        </div>
      </div>

      {tab === 'trends' ? (
        <TrendsView />
      ) : (
        <div className="page">
          {error && (
            <div className="error-banner">⚠ Couldn't reach the API — {error}</div>
          )}

          <WellnessCard
            vitals={data?.vitals}
            activity={data?.activity}
            sleep={data?.sleep}
            trends={summary}
          />

          <ProfileCard
            vitals={data?.vitals}
            activity={data?.activity}
            sleep={data?.sleep}
            lastRefresh={lastRefresh}
          />

          <Section title="Vitals"    icon="♥"  metrics={VITALS}   data={data?.vitals}   trends={summary?.vitals} />
          <Section title="Sleep"     icon="😴" metrics={SLEEP}    data={data?.sleep}    trends={summary?.sleep} />
          <Section title="Activity"  icon="👣" metrics={ACTIVITY} data={data?.activity} trends={summary?.activity} />
          <Section title="Body Comp" icon="⚖️" metrics={BODY}     data={data?.body}     trends={summary?.body} hideIfEmpty />
        </div>
      )}

      <footer className="footer">
        <div>
          Last refresh:{' '}
          {lastRefresh
            ? lastRefresh.toLocaleString('en-US', { timeZone: 'America/Detroit' })
            : '—'}
        </div>
        <div className="footer-note">Auto-refreshing every 30s</div>
      </footer>
    </>
  );
}
