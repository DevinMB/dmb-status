import { useState } from 'react';
import SleepHeatmap from './SleepHeatmap.jsx';
import TrendMetricPanel from './TrendMetricPanel.jsx';

const RANGE_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

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

function TrendSection({ title, metrics, days }) {
  return (
    <div className="section-panel">
      <div className="section-header">{title}</div>
      <div className="section-body" style={{ display: 'block' }}>
        <div className="trend-panel-grid">
          {metrics.map((m) => (
            <TrendMetricPanel key={m.key} metricKey={m.key} label={m.label} icon={m.icon} days={days} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TrendsView() {
  const [days, setDays] = useState(30);
  const heatmapDays = Math.max(days, 28);

  return (
    <div className="page">
      <div className="trends-header">
        <h2>Trends</h2>
        <div className="range-selector">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              className={`range-chip${days === opt.days ? ' active' : ''}`}
              onClick={() => setDays(opt.days)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section-panel">
        <div className="section-header">😴 Sleep</div>
        <div className="section-body" style={{ display: 'block' }}>
          <SleepHeatmap days={heatmapDays} />
        </div>
      </div>

      <TrendSection title="♥ Vitals" metrics={VITALS} days={days} />
      <TrendSection title="⚖️ Body Comp" metrics={BODY} days={days} />
      <TrendSection title="👣 Activity" metrics={ACTIVITY} days={days} />
    </div>
  );
}
