import { useEffect, useState } from 'react';
import { fetchSleepDaily } from '../api/client.js';

function levelFor(hours) {
  if (hours === null || hours === undefined) return 'none';
  if (hours < 5) return 'low';
  if (hours < 7) return 'under';
  if (hours <= 9) return 'good';
  return 'over';
}

function tipFor(night) {
  if (!night) return '';
  const hrs = night.hours === null ? 'No data' : `${night.hours.toFixed(1)}h`;
  return `${night.label} — ${hrs}`;
}

export default function SleepHeatmap({ days }) {
  const [nights, setNights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSleepDaily(days)
      .then((d) => { if (!cancelled) setNights(d.nights); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [days]);

  if (error)   return <div className="chart-msg">Failed to load sleep history</div>;
  if (!nights) return <div className="chart-msg">Loading heatmap...</div>;

  const withDow = nights.map((n) => ({ ...n, dow: new Date(`${n.date}T12:00:00`).getDay() }));
  const leadPad = withDow.length ? withDow[0].dow : 0;
  const cells = [...Array(leadPad).fill(null), ...withDow];
  while (cells.length % 7 !== 0) cells.push(null);

  const valid = nights.filter((n) => n.hours !== null);
  const avg = valid.length ? valid.reduce((s, n) => s + n.hours, 0) / valid.length : null;
  const min = valid.length ? Math.min(...valid.map((n) => n.hours)) : null;
  const max = valid.length ? Math.max(...valid.map((n) => n.hours)) : null;

  return (
    <div>
      <div className="heatmap-wrap">
        <div className="heatmap-grid">
          {cells.map((night, i) => (
            <div
              key={i}
              className="heatmap-cell"
              data-level={levelFor(night?.hours)}
              data-tip={night ? tipFor(night) : undefined}
            />
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="heatmap-cell" data-level="low" />
        <div className="heatmap-cell" data-level="under" />
        <div className="heatmap-cell" data-level="good" />
        <div className="heatmap-cell" data-level="over" />
        <span>More</span>
      </div>

      <div className="heatmap-stats">
        <div className="trend-panel-stats" style={{ marginTop: 0 }}>
          <span>AVG <b>{avg !== null ? `${avg.toFixed(1)}h` : '—'}</b></span>
          <span>MIN <b>{min !== null ? `${min.toFixed(1)}h` : '—'}</b></span>
          <span>MAX <b>{max !== null ? `${max.toFixed(1)}h` : '—'}</b></span>
          <span>NIGHTS LOGGED <b>{valid.length}/{nights.length}</b></span>
        </div>
      </div>
    </div>
  );
}
