const axios = require('axios');
const { normalizeValue, normalizeUnit } = require('./units');

const BASE = process.env.COUCHDB_URL;
const DB = process.env.COUCHDB_DB || 'health-metrics';
const AUTH = {
  username: process.env.COUCHDB_USER,
  password: process.env.COUCHDB_PASS,
};

const HIGH = '￿';

const ENTITIES = {
  vitals: [
    'sensor.devin_s_s25_heart_rate',
    'sensor.devin_s_s25_resting_heart_rate',
    'sensor.devin_s_s25_heart_rate_variability',
    'sensor.devin_s_s25_oxygen_saturation',
    'sensor.devin_s_s25_respiratory_rate',
    'sensor.devin_s_s25_systolic_blood_pressure',
    'sensor.devin_s_s25_diastolic_blood_pressure',
    'sensor.devin_s_s25_blood_glucose',
  ],
  activity: [
    'sensor.devin_s_s25_daily_steps',
    'sensor.devin_s_s25_daily_distance',
    'sensor.devin_s_s25_daily_floors',
    'sensor.devin_s_s25_daily_elevation_gained',
    'sensor.devin_s_s25_active_calories_burned',
    'sensor.devin_s_s25_total_calories_burned',
    'sensor.devin_s_s25_vo2_max',
    'sensor.devin_s_s25_detected_activity',
  ],
  body: [
    'sensor.devin_s_s25_weight',
    'sensor.devin_s_s25_body_fat',
  ],
  sleep: [
    'sensor.devin_s_s25_sleep_duration',
    'sensor.devin_s_s25_sleep_confidence',
    'sensor.devin_s_s25_sleep_segment',
  ],
};

// These reset to 0 at local midnight and climb through the day — the meaningful
// "value for a day" is the day's peak reading, not an average of intra-day samples.
const CUMULATIVE_KEYS = new Set([
  'daily_steps',
  'daily_distance',
  'daily_floors',
  'daily_elevation_gained',
  'active_calories_burned',
  'total_calories_burned',
]);

async function getLatestForEntity(entityId) {
  const res = await axios.get(`${BASE}/${DB}/_all_docs`, {
    auth: AUTH,
    params: {
      startkey: JSON.stringify(`${entityId}:${HIGH}`),
      endkey: JSON.stringify(`${entityId}:`),
      descending: true,
      limit: 1,
      include_docs: true,
    },
  });

  const rows = res.data.rows;
  if (!rows.length) return null;

  const doc = rows[0].doc;
  const raw = doc.state;
  if (raw === 'unknown' || raw === 'unavailable') return null;

  const key = entityId.replace('sensor.devin_s_s25_', '');
  const numeric = parseFloat(raw);
  return {
    entity_id: doc.entity_id,
    state: isNaN(numeric) ? raw : normalizeValue(key, numeric),
    unit: normalizeUnit(key, doc.attributes?.unit_of_measurement ?? ''),
    friendly_name: doc.attributes?.friendly_name ?? entityId,
    last_updated: doc.last_updated,
  };
}

async function getAllLatest() {
  const allEntities = Object.values(ENTITIES).flat();
  const results = await Promise.allSettled(
    allEntities.map((id) => getLatestForEntity(id).then((data) => ({ id, data })))
  );

  const out = {};
  for (const r of results) {
    if (r.status === 'fulfilled') {
      out[r.value.id] = r.value.data;
    }
  }
  return out;
}

module.exports = { getAllLatest, ENTITIES, CUMULATIVE_KEYS };
