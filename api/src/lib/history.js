const axios = require('axios');
const { CUMULATIVE_KEYS } = require('./couch');
const { normalizeValue, normalizeUnit } = require('./units');

const BASE   = process.env.COUCHDB_URL;
const DB     = process.env.COUCHDB_DB || 'health-metrics';
const AUTH   = { username: process.env.COUCHDB_USER, password: process.env.COUCHDB_PASS };
const HIGH   = '￿';
const PREFIX = 'sensor.devin_s_s25_';

async function fetchEntityDocs(entityKey, since, until) {
  const entityId = `${PREFIX}${entityKey}`;
  const startKey = `${entityId}:${since.toISOString().replace('Z', '+00:00')}`;
  const endKey   = until
    ? `${entityId}:${until.toISOString().replace('Z', '+00:00')}`
    : `${entityId}:${HIGH}`;

  const res = await axios.get(`${BASE}/${DB}/_all_docs`, {
    auth: AUTH,
    params: {
      startkey:     JSON.stringify(startKey),
      endkey:       JSON.stringify(endKey),
      include_docs: true,
    },
  });

  return res.data.rows
    .filter((r) => r.doc && r.doc.state !== 'unknown' && r.doc.state !== 'unavailable')
    .map((r) => ({
      ts:    r.doc.last_updated,
      ms:    new Date(r.doc.last_updated).getTime(),
      value: normalizeValue(entityKey, parseFloat(r.doc.state)),
      unit:  normalizeUnit(entityKey, r.doc.attributes?.unit_of_measurement ?? 's'),
    }))
    .filter((d) => !isNaN(d.value) && d.value > 0);
}

// Fetch raw time-series for charting (last `days` days).
async function getHistory(entityKey, days = 7) {
  const since = new Date(Date.now() - days * 86400_000);
  const docs  = await fetchEntityDocs(entityKey, since, null);
  return docs.map(({ ts, value }) => ({ ts, value }));
}

// Samsung's own sleep-tracking algorithm posts one sleep_segment doc per completed
// sleep session, with real start/end timestamps (epoch ms) and a duration already
// in hours — unlike sleep_confidence (a noisy signal that spikes above 90% during
// ordinary daytime rest, not just real sleep) and sleep_duration (revised/re-posted
// multiple times per session), which are not safe to sum across a time window.
async function fetchSleepSegments(since, until) {
  const entityId = `${PREFIX}sleep_segment`;
  const startKey = `${entityId}:${since.toISOString().replace('Z', '+00:00')}`;
  const endKey   = until
    ? `${entityId}:${until.toISOString().replace('Z', '+00:00')}`
    : `${entityId}:${HIGH}`;

  const res = await axios.get(`${BASE}/${DB}/_all_docs`, {
    auth: AUTH,
    params: {
      startkey:     JSON.stringify(startKey),
      endkey:       JSON.stringify(endKey),
      include_docs: true,
    },
  });

  return res.data.rows
    .filter((r) => r.doc?.attributes?.start && r.doc?.attributes?.end)
    .map((r) => ({
      start:  r.doc.attributes.start,
      end:    r.doc.attributes.end,
      hours:  parseFloat(r.doc.state),
      status: r.doc.attributes.status,
    }))
    .filter((s) => !isNaN(s.hours) && s.hours > 0);
}

// Returns { date, label, hours, segments } for the past `days` nights, oldest first.
// Segments are bucketed onto the local calendar day they ENDED on ("last night's
// sleep" is whatever you were sleeping when you woke up that morning); if more than
// one segment ends the same day (e.g. a nap plus the main sleep), the longest one is
// treated as that night's sleep and `segments` reports how many were seen.
async function getDailySleepFromSegments(days = 7) {
  // Look back a few extra days so segments reported slightly late aren't cut off,
  // then trim to the requested range after bucketing by actual sleep-end time.
  const since = new Date(Date.now() - (days + 3) * 86400_000);
  const raw = await fetchSleepSegments(since, null);

  // Samsung/HA sometimes re-posts the exact same segment verbatim — de-dupe by
  // its (start, end) rather than counting each re-post as a separate sleep.
  const seenKeys = new Set();
  const segments = raw.filter((s) => {
    const key = `${s.start}:${s.end}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const buckets = {};
  for (const s of segments) {
    const key = localDateKey(new Date(s.end).toISOString());
    if (!buckets[key]) {
      buckets[key] = { hours: s.hours, count: 1 };
    } else {
      buckets[key].count += 1;
      if (s.hours > buckets[key].hours) buckets[key].hours = s.hours;
    }
  }

  const today = new Date();
  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayDate = new Date(today.getTime() - i * 86400_000);
    const key = localDateKey(dayDate.toISOString());
    const bucket = buckets[key];
    results.push({
      date: key,
      label: dateKeyLabel(key),
      hours: bucket ? +bucket.hours.toFixed(2) : null,
      segments: bucket ? bucket.count : 0,
    });
  }

  return results;
}

// "Last night's" sleep, for the live Overview card.
async function getNightlySleep() {
  const [today] = await getDailySleepFromSegments(1);
  if (today.hours === null) return { hours: null, label: null, segments: 0 };

  const h = Math.floor(today.hours);
  const m = Math.round((today.hours - h) * 60);
  return { hours: today.hours, label: `${h}h ${m}m`, segments: today.segments };
}

// Returns an array of { date, label, hours } for the past `days` nights, oldest first.
// `date` is an ISO 'YYYY-MM-DD' (the local calendar day the night ended on) for
// calendar-grid grouping; `label` is a short display string ("Aug 19").
async function getDailySleepHistory(days = 7) {
  const daily = await getDailySleepFromSegments(days);
  return daily.map(({ date, label, hours }) => ({ date, label, hours }));
}

// Returns the local (America/Detroit) calendar-day string 'YYYY-MM-DD' for a doc timestamp.
function localDateKey(isoStr) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Detroit',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(isoStr));
  const p = Object.fromEntries(parts.filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

function dateKeyLabel(dateKey) {
  // dateKey is 'YYYY-MM-DD' interpreted as a local Detroit date; noon avoids DST edge cases.
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Buckets raw readings for one entity into local calendar days.
// Returns an array of { date, label, value, avg, min, max, last } for the past `days` days, oldest first.
// `value` is the metric's meaningful "daily number": the day's peak for cumulative
// counters (steps, distance, calories, ...) that reset at midnight, or the day's
// average for point-in-time readings (heart rate, weight, ...).
async function getDailyAggregate(entityKey, days = 30) {
  const since = new Date(Date.now() - days * 86400_000);
  const docs = await fetchEntityDocs(entityKey, since, null);
  const isCumulative = CUMULATIVE_KEYS.has(entityKey);

  const buckets = {};
  for (const d of docs) {
    const key = localDateKey(d.ts);
    (buckets[key] ??= []).push(d);
  }

  const today = new Date();
  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayDate = new Date(today.getTime() - i * 86400_000);
    const key = localDateKey(dayDate.toISOString());
    const readings = buckets[key];

    if (!readings || !readings.length) {
      results.push({ date: key, label: dateKeyLabel(key), value: null, avg: null, min: null, max: null, last: null });
      continue;
    }

    const values = readings.map((r) => r.value);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const last = readings[readings.length - 1].value;

    results.push({
      date: key,
      label: dateKeyLabel(key),
      value: isCumulative ? max : +avg.toFixed(2),
      avg: +avg.toFixed(2),
      min,
      max,
      last,
    });
  }

  return results;
}

// Compares the average of the most recent half of the window against the earlier half,
// giving a simple up/down/flat trend signal alongside period stats.
function summarizeValues(values) {
  if (!values.length) return { latest: null, avg: null, min: null, max: null, direction: null, deltaPct: null };

  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const mid = Math.floor(values.length / 2);
  const result = {
    latest: values[values.length - 1],
    avg: +avg.toFixed(2),
    min: Math.min(...values),
    max: Math.max(...values),
    direction: null,
    deltaPct: null,
  };

  if (values.length >= 4) {
    const earlier = values.slice(0, mid);
    const recent = values.slice(mid);
    const earlierAvg = earlier.reduce((s, v) => s + v, 0) / earlier.length;
    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;

    if (earlierAvg !== 0) {
      const deltaPct = ((recentAvg - earlierAvg) / Math.abs(earlierAvg)) * 100;
      result.deltaPct = +deltaPct.toFixed(1);
      result.direction = Math.abs(deltaPct) < 2 ? 'flat' : deltaPct > 0 ? 'up' : 'down';
    }
  }

  return result;
}

// Trend summary (latest/avg/min/max/direction) for every raw entity, over `days`.
// Point-in-time metrics are summarized from raw readings; cumulative daily counters
// (steps, distance, calories, ...) are summarized from their per-day totals instead,
// since averaging raw intra-day samples of a counter that resets nightly is meaningless.
async function getEntitySummaries(entityKeys, days = 7) {
  const since = new Date(Date.now() - days * 86400_000);
  const results = await Promise.allSettled(
    entityKeys.map((key) => {
      if (CUMULATIVE_KEYS.has(key)) {
        return getDailyAggregate(key, days).then((daily) => [
          key,
          daily.filter((d) => d.value !== null).map((d) => d.value),
        ]);
      }
      return fetchEntityDocs(key, since, null).then((docs) => [key, docs.map((d) => d.value)]);
    })
  );

  const out = {};
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    const [key, values] = r.value;
    out[key] = summarizeValues(values);
  }
  return out;
}

// Trend summary for the computed nightly sleep total, over `days` nights.
async function getSleepSummary(days = 7) {
  const nights = await getDailySleepHistory(days);
  const values = nights.filter((n) => n.hours !== null).map((n) => n.hours);
  return summarizeValues(values);
}

module.exports = {
  getHistory,
  getNightlySleep,
  getDailySleepHistory,
  getDailyAggregate,
  getEntitySummaries,
  getSleepSummary,
};
