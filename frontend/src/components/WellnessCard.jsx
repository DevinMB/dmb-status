import { computeWellness, summarizeDay } from '../lib/wellness.js';

function tierFor(score) {
  if (score === null) return 'none';
  if (score >= 85) return 'great';
  if (score >= 65) return 'ok';
  return 'low';
}

function ScoreRing({ score }) {
  const tier = tierFor(score);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const pct = score ?? 0;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className={`score-ring score-ring--${tier}`}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} className="score-ring-track" strokeWidth="5" fill="none" />
        {score !== null && (
          <circle
            cx="32" cy="32" r={radius}
            className="score-ring-fill"
            strokeWidth="5"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        )}
      </svg>
      <span className="score-ring-value">{score ?? '—'}</span>
    </div>
  );
}

export default function WellnessCard({ vitals, activity, sleep, trends }) {
  const wellness = computeWellness({ vitals, activity, sleep });
  const sentence = summarizeDay(wellness, { activity, sleep }, trends);

  return (
    <div className="wellness-card">
      <ScoreRing score={wellness.score} />
      <div className="wellness-text">
        <span className="wellness-label">Today</span>
        <span className="wellness-sentence">{sentence}</span>
      </div>
    </div>
  );
}
