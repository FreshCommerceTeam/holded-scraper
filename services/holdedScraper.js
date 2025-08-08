// services/holdedScraper.js
const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

class HoldedScraper {
  /**
   * Extrae ausencias aceptadas desde Holded.
   * Requiere HOLDED_EMAIL y HOLDED_PASSWORD en variables de entorno.
   * Devuelve un array de objetos con las columnas visibles en la tabla.
   */
  static async getEmployeeLeaveData() {
    const email = process.env.HOLDED_EMAIL;
    const password = process.env.HOLDED_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'Faltan variables de entorno: HOLDED_EMAIL y/o HOLDED_PASSWORD'
      );
    }

    logger.info('Launching Puppeteer (Chromium embebido)...');
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: puppeteer.executablePath(), // Forzamos el Chromium descargado por Puppeteer
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      // Endurecemos un poco el contexto
      await page.setDefaultTimeout(30000); // 30s
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
      );

      logger.info('Navigating to Holded login...');
      await page.goto('https://app.holded.com/login', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Campos de login
      await page.waitForSelector('input[type="email"]', { visible: true });
      await page.type('input[type="email"]', email, { delay: 10 });

      await page.waitForSelector('input[type="password"]', { visible: true });
      await page.type('input[type="password"]', password, { delay: 10 });

      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
      ]);

      // Sanity check: si sigue en /login, es que no ha entrado
      const urlAfterLogin = page.url();
      if (urlAfterLogin.includes('/login')) {
        throw new Error('Login en Holded fallido. Revisa credenciales/2FA.');
      }

      logger.info('Navigating to accepted leaves...');
      await page.goto(
        'https://app.holded.com/team/leaves?filter=status-accepted',
        { waitUntil: 'networkidle2', timeout: 60000 }
      );

      logger.info('Waiting for table...');
      // A veces los IDs/clases cambian; primero esperamos algo general y luego afinamos
      await page.waitForSelector('table', { timeout: 30000 });

      // Si existe #docstable lo usamos; si no, buscamos por tabla visible con thead/tbody
      const hasDocsTable = await page.$('#docstable');
      const tableSelector = hasDocsTable ? '#docstable' : 'table';

      await page.waitForSelector(`${tableSelector} tbody tr`, { timeout: 30000 });

      const rows = await page.$$eval(`${tableSelector} tbody tr`, trs =>
        trs.map(tr => {
          const tds = Array.from(tr.querySelectorAll('td'));
          const txt = i => (tds[i] ? tds[i].innerText.trim() : '');

          // Ajusta los índices si la tabla cambiara de orden/columnas
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

      logger.info(`Scraping completed. Found ${rows.length} rows.`);
      return rows;
    } catch (err) {
      logger.error(`Error en HoldedScraper: ${err.message}`);
      throw err;
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}

module.exports = HoldedScraper;
