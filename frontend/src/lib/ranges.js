// Each entry may include:
//   low/high   — the "healthy" band (used for color: green inside, orange outside)
//   warn       — [min, max] outside which the bar turns red
//   barLow/barHigh — override the scale used for bar fill (defaults to low/high)
//   unit       — display unit string

export const RANGES = {
  heart_rate: {
    low: 50, high: 100, warn: [40, 130],
    barLow: 30, barHigh: 130,
    unit: 'bpm',
  },
  resting_heart_rate: {
    low: 40, high: 80, warn: [35, 100],
    barLow: 30, barHigh: 100,
    unit: 'bpm',
  },
  heart_rate_variability: {
    low: 20, high: 80, warn: [10, 100],
    barLow: 0, barHigh: 100,
    unit: 'ms',
  },
  oxygen_saturation: {
    // Bar fills to the raw % value (93% → 93% bar); green above 85%
    low: 85, high: 100, warn: [75, 100],
    barLow: 0, barHigh: 100,
    unit: '%',
  },
  respiratory_rate: {
    low: 12, high: 20, warn: [8, 28],
    barLow: 8, barHigh: 28,
    unit: '/min',
  },
  systolic_blood_pressure: {
    low: 90, high: 120, warn: [70, 160],
    barLow: 70, barHigh: 160,
    unit: 'mmHg',
  },
  diastolic_blood_pressure: {
    low: 60, high: 80, warn: [40, 110],
    barLow: 40, barHigh: 110,
    unit: 'mmHg',
  },
  blood_glucose: {
    low: 70, high: 140, warn: [54, 250],
    barLow: 54, barHigh: 250,
    unit: 'mg/dL',
  },
  // Steps: bar fills toward 7k goal; green once goal met
  daily_steps: {
    low: 7000, high: 12000, warn: [0, 20000],
    barLow: 0, barHigh: 7000,
    unit: 'steps',
  },
  daily_distance: {
    low: 5, high: 15, warn: [0, 30],
    barLow: 0, barHigh: 15,
    unit: 'km',
  },
  daily_floors: {
    low: 5, high: 20, warn: [0, 40],
    barLow: 0, barHigh: 20,
    unit: 'fl',
  },
  daily_elevation_gained: {
    low: 30, high: 200, warn: [0, 500],
    barLow: 0, barHigh: 200,
    unit: 'm',
  },
  active_calories_burned: {
    low: 300, high: 800, warn: [0, 1500],
    barLow: 0, barHigh: 800,
    unit: 'kcal',
  },
  total_calories_burned: {
    low: 1800, high: 3500, warn: [0, 5000],
    barLow: 0, barHigh: 3500,
    unit: 'kcal',
  },
  vo2_max: {
    low: 35, high: 60, warn: [20, 80],
    barLow: 20, barHigh: 80,
    unit: 'mL/kg',
  },
  weight: {
    low: 50, high: 200, warn: [30, 300],
    barLow: 30, barHigh: 200,
    unit: 'kg',
  },
  body_fat: {
    low: 8, high: 25, warn: [3, 40],
    barLow: 3, barHigh: 40,
    unit: '%',
  },
  sleep_total_hours: {
    low: 7, high: 9, warn: [4, 12],
    barLow: 0, barHigh: 9,
    unit: 'h',
  },
  sleep_confidence: {
    low: 80, high: 100, warn: [50, 100],
    barLow: 0, barHigh: 100,
    unit: '%',
  },
};

// Metrics that reset to 0 at local midnight and climb through the day — for these,
// a day's meaningful chart value is the day's peak, not an average of intra-day samples.
export const CUMULATIVE_KEYS = new Set([
  'daily_steps',
  'daily_distance',
  'daily_floors',
  'daily_elevation_gained',
  'active_calories_burned',
  'total_calories_burned',
]);

export function getStatus(key, value) {
  const r = RANGES[key];
  if (!r || typeof value !== 'number' || isNaN(value)) {
    return { pct: 0, cls: 'hp-grey', color: '#90A4AE' };
  }

  const barLow  = r.barLow  ?? r.low;
  const barHigh = r.barHigh ?? r.high;
  const span    = barHigh - barLow || 1;
  const pct     = Math.min(100, Math.max(2, ((value - barLow) / span) * 100));

  let cls, color;
  if (value < r.warn[0] || value > r.warn[1]) { cls = 'hp-red';    color = '#E53935'; }
  else if (value < r.low  || value > r.high)  { cls = 'hp-orange'; color = '#FB8C00'; }
  else                                          { cls = 'hp-green';  color = '#43A047'; }

  return { pct, cls, color };
}
