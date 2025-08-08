// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const logger = require('./utils/logger');
const HoldedScraper = require('./services/holdedScraper');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.get('/ausencias', async (req, res) => {
  logger.info('Starting /ausencias request');
  try {
    const data = await HoldedScraper.getEmployeeLeaveData();
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    logger.error(`Error in /ausencias: ${err.stack || err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
