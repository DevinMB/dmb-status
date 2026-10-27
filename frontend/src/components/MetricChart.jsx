import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { RANGES } from '../lib/ranges.js';
import { fetchHistory } from '../api/client.js';

function fmtTick(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/Detroit',
    month: 'short',
    day: 'numeric',
  });
}

function fmtTooltip(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', {
    timeZone: 'America/Detroit',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Keep only one point per hour to declutter dense sensors (e.g. heart rate)
function downsample(points) {
  if (points.length <= 168) return points; // ≤ 7 days hourly, no reduction needed
  const buckets = {};
  for (const p of points) {
    const h = p.ts.slice(0, 13); // YYYY-MM-DDTHH
    if (!buckets[h]) buckets[h] = [];
    buckets[h].push(p.value);
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([h, vals]) => ({
      ts: h + ':00:00+00:00',
      value: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10,
    }));
}

export default function MetricChart({ metricKey }) {
  const [points, setPoints] = useState(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(metricKey, 7)
      .then((d) => { if (!cancelled) setPoints(downsample(d.points)); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [metricKey]);

  const range = RANGES[metricKey];

  if (error)   return <div className="chart-msg">Failed to load history</div>;
  if (!points) return <div className="chart-msg">Loading chart...</div>;
  if (!points.length) return <div className="chart-msg">No history data</div>;

  const vals = points.map((p) => p.value);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const pad = (maxVal - minVal) * 0.15 || 1;

  return (
    <div className="metric-chart">
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="ts"
            tickFormatter={fmtTick}
            tick={{ fontSize: 9, fontFamily: 'ui-monospace, monospace', fill: '#5B6472' }}
            interval="preserveStartEnd"
            stroke="#242A35"
          />
          <YAxis
            domain={[minVal >= 0 ? Math.max(0, Math.floor(minVal - pad)) : Math.floor(minVal - pad), Math.ceil(maxVal + pad)]}
            tick={{ fontSize: 9, fontFamily: 'ui-monospace, monospace', fill: '#5B6472' }}
            stroke="#242A35"
            tickCount={4}
            allowDecimals={false}
            tickFormatter={(v) => Math.round(v).toLocaleString('en-US')}
          />
          <Tooltip
            labelFormatter={fmtTooltip}
            formatter={(v) => [v, metricKey.replace(/_/g, ' ')]}
            contentStyle={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', background: '#151920', border: '1px solid #242A35', borderRadius: 6, color: '#E7EAF0' }}
            labelStyle={{ color: '#98A2B3' }}
          />
          {range && (
            <>
              <ReferenceLine y={range.low}  stroke="#34D399" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={range.high} stroke="#34D399" strokeDasharray="3 3" strokeWidth={1} />
            </>
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4FC3F7"
            strokeWidth={1.5}
            dot={points.length < 50 ? { r: 2, fill: '#4FC3F7' } : false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
