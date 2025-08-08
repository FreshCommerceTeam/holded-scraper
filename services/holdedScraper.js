// services/holdedScraper.js
const puppeteer = require('puppeteer');

class HoldedScraper {
  static async getEmployeeLeaveData() {
    const email = process.env.HOLDED_EMAIL;
    const password = process.env.HOLDED_PASSWORD;

    if (!email || !password) {
      throw new Error('Faltan variables de entorno: HOLDED_EMAIL y/o HOLDED_PASSWORD');
    }

    console.log('[INFO] Launching Puppeteer (Chromium embebido)...');
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: puppeteer.executablePath(), // <-- clave en Render
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.setDefaultTimeout(30000);
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
      );

      console.log('[INFO] Navigating to Holded login...');
      await page.goto('https://app.holded.com/login', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await page.waitForSelector('input[type="email"]', { visible: true });
      await page.type('input[type="email"]', email, { delay: 10 });

      await page.waitForSelector('input[type="password"]', { visible: true });
      await page.type('input[type="password"]', password, { delay: 10 });

      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
      ]);

      if (page.url().includes('/login')) {
        throw new Error('Login en Holded fallido. Revisa credenciales/2FA.');
      }

      console.log('[INFO] Navigating to accepted leaves...');
      await page.goto(
        'https://app.holded.com/team/leaves?filter=status-accepted',
        { waitUntil: 'networkidle2', timeout: 60000 }
      );

      console.log('[INFO] Waiting for table...');
      await page.waitForSelector('#docstable tbody tr', { timeout: 30000 });

      const rows = await page.$$eval('#docstable tbody tr', trs =>
        trs.map(tr => {
          const tds = Array.from(tr.querySelectorAll('td'));
          const txt = i => (tds[i] ? tds[i].innerText.trim() : '');
          return {
            inicio: txt(1),
            final: txt(2),
            empleado: txt(3),
            tipoAusencia: txt(4),
            descripcion: txt(5),
            numeroDias: txt(6),
            periodo: txt(7),
            estado: txt(8)
          };
        })
      );

      console.log(`[INFO] Scraping completed. Found ${rows.length} rows.`);
      return rows;
    } catch (err) {
      console.error('[ERROR] HoldedScraper:', err.message);
      throw err;
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}

module.exports = HoldedScraper;
