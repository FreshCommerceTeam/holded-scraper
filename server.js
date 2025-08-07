const express = require('express');
const cors = require('cors');
require('dotenv').config();

const HoldedScraper = require('./services/holdedScraper');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const holdedScraper = new HoldedScraper();

app.get('/', (req, res) => {
    res.json({
        name: 'Holded Employee Leave Data Scraper API',
        version: '1.0.0',
        endpoints: {
            'GET /': 'API info',
            'GET /health': 'Health check',
            'GET /ausencias': 'Scrape leave data from Holded'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/ausencias', async (req, res, next) => {
    try {
        logger.info('Starting /ausencias request');
        const data = await holdedScraper.getEmployeeLeaveData();
        res.json({ success: true, data, timestamp: new Date().toISOString(), count: data.length });
    } catch (error) {
        logger.error('Error in /ausencias:', error);
        next(error);
    }
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
});