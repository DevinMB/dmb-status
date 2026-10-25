import { RANGES } from './ranges.js';

// Core signals for the daily score: point-in-time readings only, each valid to
// compare against its healthy range at any hour. Steps is deliberately excluded —
// it's a cumulative counter that climbs all day, so scoring it against a full-day
// target would unfairly tank the score every morning; it's still called out as a
// plain fact in the summary sentence below instead.
const SCORE_METRICS = [
  { category: 'sleep',  key: 'sleep_total_hours',  label: 'sleep' },
  { category: 'vitals', key: 'resting_heart_rate', label: 'resting heart rate' },
  { category: 'vitals', key: 'heart_rate',         label: 'heart rate' },
  { category: 'vitals', key: 'oxygen_saturation',  label: 'oxygen saturation' },
];

// Scores one reading 0-100 against its healthy range: 100 anywhere inside [low, high],
// tapering linearly to 0 at the warn bounds — so a single borderline reading dents the
// score instead of zeroing it out the way a hard pass/fail would.
function scoreValue(key, value) {
  const r = RANGES[key];
  if (!r || typeof value !== 'number' || isNaN(value)) return null;

  if (value >= r.low && value <= r.high) return 100;

  const [warnLow, warnHigh] = r.warn;
  if (value < r.low) {
    if (value <= warnLow) return 0;
    return Math.round(((value - warnLow) / (r.low - warnLow)) * 100);
  }
  if (value >= warnHigh) return 0;
  return Math.round(((warnHigh - value) / (warnHigh - r.high)) * 100);
}

// Averages whatever of the core signals has data today into a single 0-100 score.
// Returns { score: null, factors: [] } when nothing has data yet.
export function computeWellness({ vitals, activity, sleep }) {
  const data = { vitals, activity, sleep };
  const factors = [];

  for (const m of SCORE_METRICS) {
    const value = data[m.category]?.[m.key]?.state;
    const score = scoreValue(m.key, typeof value === 'number' ? value : null);
    if (score !== null) factors.push({ ...m, value, score });
  }

  if (!factors.length) return { score: null, factors: [] };

  const score = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  return { score, factors };
}

function fmtSleep(sleep) {
  const entry = sleep?.sleep_total_hours;
  if (!entry) return null;
  return entry.label ?? (typeof entry.state === 'number' ? `${entry.state}h` : null);
}

// Builds a short, plain-language sentence: an overall read on the day, plus the one
// or two facts (sleep, steps, an out-of-range vital) most worth surfacing.
export function summarizeDay({ score, factors }, { activity, sleep } = {}, trends) {
  if (score === null) return 'Not enough data yet today.';

  const opener = score >= 85 ? 'Solid day'
    : score >= 65 ? 'A fairly typical day'
    : 'A rougher day than usual';

  const facts = [];

  const sleepLabel = fmtSleep(sleep);
  if (sleepLabel) facts.push(`slept ${sleepLabel}`);

  // Steps only fairly compares to a full-day average once most of the day has
  // passed — comparing a 10am step count to an all-day average always reads as
  // "down", which is just the day being unfinished, not a real signal.
  const localHour = parseInt(
    new Date().toLocaleString('en-US', { timeZone: 'America/Detroit', hour: '2-digit', hour12: false }),
    10
  );
  const steps = activity?.daily_steps?.state;
  const stepsTrend = trends?.activity?.daily_steps;
  if (typeof steps === 'number') {
    let stepsClause = `${steps.toLocaleString()} steps so far`;
    if (localHour >= 18 && stepsTrend?.direction && stepsTrend.direction !== 'flat' && Math.abs(stepsTrend.deltaPct) >= 15) {
      stepsClause += ` (${stepsTrend.direction === 'up' ? 'up' : 'down'} ${Math.abs(stepsTrend.deltaPct)}% vs your recent average)`;
    }
    facts.push(stepsClause);
  }

  const worst = [...factors].sort((a, b) => a.score - b.score)[0];
  if (worst && worst.score < 60 && worst.key !== 'sleep_total_hours') {
    facts.push(`${worst.label} is outside your usual range`);
  }

  return facts.length ? `${opener} — ${facts.join(', ')}.` : `${opener}.`;
}
