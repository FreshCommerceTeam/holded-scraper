const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

class HoldedScraper {
    async getEmployeeLeaveData() {
        logger.info('Launching Puppeteer...');

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: puppeteer.executablePath(), // 🔥 FORZAMOS el Chromium descargado
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ]
        });

        const page = await browser.newPage();

        logger.info('Navigating to Holded login...');
        await page.goto('https://app.holded.com/login', { waitUntil: 'networkidle0' });

        await page.type('input[type="email"]', process.env.HOLDED_EMAIL);
        await page.type('input[type="password"]', process.env.HOLDED_PASSWORD);
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0' })
        ]);

        logger.info('Navigating to leave data...');
        await page.goto('https://app.holded.com/team/leaves?filter=status-accepted', { waitUntil: 'networkidle0' });

        logger.info('Waiting for table...');
        await page.waitForSelector('#docstable');

        const rows = await page.$$eval('#docstable tbody tr', trs => trs.map(tr => {
            const tds = tr.querySelectorAll('td');
            return {
                inicio: tds[1]?.innerText.trim(),
                final: tds[2]?.innerText.trim(),
                empleado: tds[3]?.innerText.trim(),
                tipoAusencia: tds[4]?.innerText.trim(),
                descripcion: tds[5]?.innerText.trim(),
                numeroDias: tds[6]?.innerText.trim(),
                periodo: tds[7]?.innerText.trim(),
                estado: tds[8]?.innerText.trim(),
            };
        }));

        await browser.close();
        logger.info(`Scraping completed. Found ${rows.length} rows.`);
        return rows;
    }
}

module.exports = HoldedScraper;
