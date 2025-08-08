// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const HoldedScraper = require('./services/holdedScraper');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Logs explícitos para ver en Render si arranca y el puerto correcto
console.log('[BOOT] starting app...');
console.log('[BOOT] NODE_ENV =', process.env.NODE_ENV);
console.log('[BOOT] PORT =', process.env.PORT);

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.get('/', (req, res) => {
  res.type('text').send('Holded scraper live');
});

app.get('/ausencias', async (req, res) => {
  console.log('[INFO] Starting /ausencias request');
  try {
    const data = await HoldedScraper.getEmployeeLeaveData();
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    console.error('[ERROR] /ausencias:', err.stack || err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`[BOOT] Server running on port ${PORT}`);
});
