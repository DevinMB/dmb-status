import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { fetchSleepDaily } from '../api/client.js';

function barColor(hours) {
  if (hours === null) return '#5B6472';
  if (hours >= 7 && hours <= 9) return '#34D399';
  if (hours >= 5)               return '#FBBF24';
  return '#F87171';
}

export default function SleepBarChart() {
  const [nights, setNights] = useState(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSleepDaily(7)
      .then((d) => { if (!cancelled) setNights(d.nights); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  if (error)   return <div className="chart-msg">Failed to load sleep history</div>;
  if (!nights) return <div className="chart-msg">Loading chart...</div>;

  const data = nights.map((n) => ({ ...n, display: n.hours ?? 0 }));

  return (
    <div className="metric-chart">
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fontFamily: 'ui-monospace, monospace', fill: '#5B6472' }}
            stroke="#242A35"
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 9, fontFamily: 'ui-monospace, monospace', fill: '#5B6472' }}
            stroke="#242A35"
            tickCount={6}
          />
          <Tooltip
            formatter={(v, _name, props) =>
              props.payload.hours === null ? ['No data', 'Sleep'] : [`${v.toFixed(1)}h`, 'Sleep']
            }
            contentStyle={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', background: '#151920', border: '1px solid #242A35', borderRadius: 6, color: '#E7EAF0' }}
            labelStyle={{ color: '#98A2B3' }}
          />
          <ReferenceLine y={7} stroke="#34D399" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine y={9} stroke="#34D399" strokeDasharray="3 3" strokeWidth={1} />
          <Bar dataKey="display" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.hours)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
