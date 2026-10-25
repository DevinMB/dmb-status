import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { RANGES, CUMULATIVE_KEYS } from '../lib/ranges.js';
import { fetchDailyAggregate } from '../api/client.js';

export default function TrendMetricPanel({ metricKey, label, icon, days }) {
  const [daily, setDaily] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setDaily(null);
    fetchDailyAggregate(metricKey, days)
      .then((d) => { if (!cancelled) setDaily(d.daily); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [metricKey, days]);

  const range = RANGES[metricKey];
  const isCumulative = CUMULATIVE_KEYS.has(metricKey);
  const unit = range?.unit ?? '';

  const valid = (daily ?? []).filter((d) => d.value !== null);
  const avg = valid.length ? valid.reduce((s, d) => s + d.value, 0) / valid.length : null;
  const min = valid.length ? Math.min(...valid.map((d) => d.value)) : null;
  const max = valid.length ? Math.max(...valid.map((d) => d.value)) : null;

  return (
    <div className="trend-panel">
      <div className="trend-panel-top">
        <span className="trend-panel-label">{icon} {label}</span>
      </div>

      {error && <div className="chart-msg">Failed to load</div>}
      {!error && !daily && <div className="chart-msg">Loading...</div>}
      {!error && daily && !valid.length && <div className="chart-msg">No history data</div>}

      {!error && daily && valid.length > 0 && (
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart data={daily} margin={{ top: 4, right: 6, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fontFamily: 'ui-monospace, monospace', fill: '#5B6472' }}
              interval="preserveStartEnd"
              stroke="#242A35"
            />
            <YAxis
              tick={{ fontSize: 9, fontFamily: 'ui-monospace, monospace', fill: '#5B6472' }}
              stroke="#242A35"
              tickCount={4}
            />
            <Tooltip
              formatter={(v) => [v == null ? 'No data' : v, isCumulative ? 'Total' : 'Avg']}
              contentStyle={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', background: '#151920', border: '1px solid #242A35', borderRadius: 6, color: '#E7EAF0' }}
              labelStyle={{ color: '#98A2B3' }}
            />
            {range && !isCumulative && (
              <>
                <ReferenceLine y={range.low}  stroke="#34D399" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={range.high} stroke="#34D399" strokeDasharray="3 3" strokeWidth={1} />
              </>
            )}
            {isCumulative ? (
              <Bar dataKey="value" fill="#4FC3F7" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4FC3F7"
                strokeWidth={1.5}
                dot={daily.length < 40 ? { r: 2, fill: '#4FC3F7' } : false}
                isAnimationActive={false}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="trend-panel-stats">
        <span>AVG <b>{avg !== null ? avg.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}</b></span>
        <span>MIN <b>{min !== null ? min.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}</b></span>
        <span>MAX <b>{max !== null ? max.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}</b></span>
        {unit && <span>{unit}</span>}
      </div>
    </div>
  );
}
