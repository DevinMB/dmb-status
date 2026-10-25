const express = require('express');
const {
  getHistory,
  getDailySleepHistory,
  getDailyAggregate,
  getEntitySummaries,
  getSleepSummary,
} = require('../lib/history');
const { ENTITIES } = require('../lib/couch');

const router = express.Router();

router.get('/sleep/daily', async (req, res) => {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days ?? '7', 10)));
  try {
    const nights = await getDailySleepHistory(days);
    res.json({ days, nights });
  } catch (err) {
    console.error('Daily sleep history failed:', err.message);
    res.status(502).json({ error: 'Failed to fetch daily sleep history' });
  }
});

// Trend summary (latest/avg/min/max/direction) for every metric, grouped by category.
router.get('/summary', async (req, res) => {
  const days = Math.min(90, Math.max(2, parseInt(req.query.days ?? '7', 10)));

  try {
    const rawKeys = Object.values(ENTITIES).flat().map((id) => id.replace('sensor.devin_s_s25_', ''));
    const [rawSummaries, sleepSummary] = await Promise.all([
      getEntitySummaries(rawKeys, days),
      getSleepSummary(days),
    ]);

    const summary = {};
    for (const [category, entities] of Object.entries(ENTITIES)) {
      summary[category] = {};
      for (const entityId of entities) {
        const key = entityId.replace('sensor.devin_s_s25_', '');
        summary[category][key] = rawSummaries[key] ?? null;
      }
    }
    summary.sleep = summary.sleep ?? {};
    summary.sleep.sleep_total_hours = sleepSummary;

    res.json({ days, summary });
  } catch (err) {
    console.error('Summary fetch failed:', err.message);
    res.status(502).json({ error: 'Failed to fetch summary' });
  }
});

// Daily-bucketed avg/min/max for one metric — powers the Trends charts.
router.get('/:entity/daily', async (req, res) => {
  const { entity } = req.params;
  const days = Math.min(180, Math.max(1, parseInt(req.query.days ?? '30', 10)));

  try {
    const daily = await getDailyAggregate(entity, days);
    res.json({ entity, days, daily });
  } catch (err) {
    console.error(`Daily aggregate failed for ${entity}:`, err.message);
    res.status(502).json({ error: 'Failed to fetch daily aggregate' });
  }
});

router.get('/:entity', async (req, res) => {
  const { entity } = req.params;
  const days = Math.min(30, Math.max(1, parseInt(req.query.days ?? '7', 10)));

  try {
    const points = await getHistory(entity, days);
    res.json({ entity, days, points });
  } catch (err) {
    console.error(`History fetch failed for ${entity}:`, err.message);
    res.status(502).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
