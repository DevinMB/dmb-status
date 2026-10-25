const express = require('express');
const { getAllLatest, ENTITIES } = require('../lib/couch');
const { getNightlySleep } = require('../lib/history');

const router = express.Router();

router.get('/latest', async (req, res) => {
  try {
    const [raw, sleepTotal] = await Promise.all([getAllLatest(), getNightlySleep()]);

    const response = {
      vitals: {},
      activity: {},
      body: {},
      sleep: {},
      fetched_at: new Date().toISOString(),
    };

    for (const [category, entities] of Object.entries(ENTITIES)) {
      for (const entityId of entities) {
        const key = entityId.replace('sensor.devin_s_s25_', '');
        response[category][key] = raw[entityId] ?? null;
      }
    }

    // Computed nightly total: durations paired with sleep_confidence >= 90%
    response.sleep.sleep_total_hours = sleepTotal.hours !== null
      ? { state: sleepTotal.hours, unit: 'h', label: sleepTotal.label, segments: sleepTotal.segments, last_updated: new Date().toISOString() }
      : null;

    res.json(response);
  } catch (err) {
    console.error('Failed to fetch metrics:', err.message);
    res.status(502).json({ error: 'Failed to reach CouchDB' });
  }
});

module.exports = router;
