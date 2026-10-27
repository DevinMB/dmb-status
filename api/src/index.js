require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const metricsRouter = require('./routes/metrics');
const historyRouter = require('./routes/history');

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

// Every request reaches the API through the frontend's nginx, so req.ip is
// that container for all visitors and they would share one bucket. Key on
// the visitor instead: Cloudflare sets CF-Connecting-IP on tunnel traffic,
// and nginx's X-Real-IP covers direct LAN requests. One Trends view is about
// 20 calls, and each range switch another 20.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    keyGenerator: (req) => ipKeyGenerator(req.get('cf-connecting-ip') || req.get('x-real-ip') || req.ip),
    validate: { xForwardedForHeader: false },
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Rate limit exceeded' },
  })
);

app.use('/api/metrics', metricsRouter);
app.use('/api/history', historyRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`health-api on :${PORT}`));
