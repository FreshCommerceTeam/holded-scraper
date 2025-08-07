const { chromium } = require('playwright-core');
const logger = require('../utils/logger');

class HoldedScraper {
    async getEmployeeLeaveData() {
        logger.info('Launching Chromium...');
        const browser = await chromium.launch({
            headless: true,
            executablePath: '/usr/bin/chromium-browser', // Alternativas: /usr/bin/chromium o /usr/bin/google-chrome
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        logger.info('Navigating to Holded login...');
        await page.goto('https://app.holded.com/login');
        await page.fill('input[type="email"]', process.env.HOLDED_EMAIL);
        await page.fill('input[type="password"]', process.env.HOLDED_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        logger.info('Navigating to leave data...');
        await page.goto('https://app.holded.com/team/leaves?filter=status-accepted');
        await page.waitForSelector('#docstable');

        logger.info('Scraping table...');
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
