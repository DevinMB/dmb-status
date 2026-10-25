import { useState } from 'react';
import { RANGES, getStatus } from '../lib/ranges.js';
import MetricChart from './MetricChart.jsx';
import SleepBarChart from './SleepBarChart.jsx';

function fmtValue(value, key) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (key === 'sleep_duration') return (value / 3600).toFixed(1);
  if (Number.isInteger(value))  return value.toLocaleString();
  return value.toFixed(1);
}

function TrendChip({ trend }) {
  if (!trend || trend.direction == null || trend.deltaPct == null) return null;
  const { direction, deltaPct } = trend;
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—';
  return (
    <span className={`trend-chip ${direction}`}>
      {arrow} {Math.abs(deltaPct)}%
    </span>
  );
}

export default function MetricCard({ label, icon, metricKey, metric, chartable = true, trend }) {
  const [open, setOpen] = useState(false);

  const value      = metric?.state ?? null;
  // sleep_total_hours carries a pre-formatted "Xh Ym" label — use it directly
  const displayVal = metric?.label ?? fmtValue(value, metricKey);
  const numVal     = typeof value === 'number' ? value : null;
  const { pct, cls } = getStatus(metricKey, numVal);
  // Don't show unit when a formatted label is already set
  const unit       = metric?.label ? '' : (RANGES[metricKey]?.unit ?? metric?.unit ?? '');
  const hasData    = displayVal !== null;
  const clickable  = chartable && hasData;
  const isSleepConf = metricKey === 'sleep_confidence';

  return (
    <div
      className={`metric-card${clickable ? ' metric-card--clickable' : ''}`}
      onClick={clickable ? () => setOpen((o) => !o) : undefined}
    >
      <div className="metric-top">
        <span className="metric-label">{icon} {label}</span>
        {clickable && <span className="metric-expand-btn">{open ? '▲' : '▼'}</span>}
      </div>

      {hasData ? (
        <div className="metric-value-row">
          <span className="metric-value">
            {displayVal}
            {unit && <span className="unit"> {unit}</span>}
          </span>
          <TrendChip trend={trend} />
        </div>
      ) : (
        <span className="metric-null">-- NO DATA --</span>
      )}

      {isSleepConf ? (
        hasData && numVal >= 90 && <span className="sleep-status-label">Asleep</span>
      ) : (
        <div className="hp-bar-wrap">
          <div
            className={`hp-bar-fill ${hasData ? cls : 'hp-grey'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {open && (metricKey === 'sleep_total_hours'
        ? <SleepBarChart />
        : <MetricChart metricKey={metricKey} />
      )}
    </div>
  );
}
