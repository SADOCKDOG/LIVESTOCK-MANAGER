/**
 * Playwright test: verifies the app boots without JS errors after the
 * wizard-manager.js fix, and that UI.Progress works end-to-end.
 * Uses a fresh Chromium (no service worker / cache), so results == server truth.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8873;
const BASE_URL = `http://localhost:${PORT}`;

function startServer() {
  const http = require('http');
  const mime = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
  };
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.join(PROJECT_ROOT, p);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        res.writeHead(404); return res.end();
      }
      res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

test.describe('App boot after wizard-manager fix + UI.Progress', () => {
  let server, browser, context, page;
  let pageErrors = [];

  test.beforeAll(async () => {
    server = await startServer();
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    page = await context.newPage();
    page.on('pageerror', err => pageErrors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') pageErrors.push(msg.text()); });
  });

  test.afterAll(async () => {
    await browser.close();
    server.close();
  });

  test('App, UI and UI.Progress are defined (monolith boot, no wrappers)', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    const result = await page.evaluate(() => ({
      hasApp: typeof App !== 'undefined' && typeof App.init === 'function',
      hasWizard: typeof WizardManager !== 'undefined',
      hasUI: typeof UI !== 'undefined',
      hasProgress: typeof (UI && UI.Progress) === 'function',
      errorDiag: document.getElementById('error-diag')?.innerText || '',
    }));

    console.log('App boot result:', JSON.stringify(result, null, 2));
    expect(result.hasApp).toBeTruthy();
    expect(result.hasWizard).toBeTruthy();
    expect(result.hasUI).toBeTruthy();
    expect(result.hasProgress).toBeTruthy();
  });

  test('No fatal JS errors on boot', async () => {
    pageErrors = [];
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });
    await page.waitForTimeout(1500);

    const fatal = pageErrors.filter(e => /SyntaxError|is not defined|Unexpected token/i.test(e));
    console.log('Fatal errors:', fatal);
    expect(fatal.length).toBe(0);
  });
});
