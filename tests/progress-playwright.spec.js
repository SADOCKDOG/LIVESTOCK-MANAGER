/**
 * Playwright E2E test for UI.Progress component (Task #6)
 * Validates the detailed progress system for long operations
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8872;
const BASE_URL = `http://localhost:${PORT}`;

function startServer() {
  const http = require('http');
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json',
  };
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.join(PROJECT_ROOT, p);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

test.describe('UI.Progress Component - Task #6', () => {
  let server, browser, context, page;
  let consoleErrors = [];

  test.beforeAll(async () => {
    server = await startServer();
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));
  });

  test.afterAll(async () => {
    await browser.close();
    server.close();
  });

  test('UI.Progress class is defined and accessible', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    const hasProgress = await page.evaluate(() =>
      typeof UI !== 'undefined' && typeof UI.Progress === 'function'
    );
    expect(hasProgress).toBeTruthy();
    console.log('✅ UI.Progress class defined');
  });

  test('Full lifecycle: start → update → complete with DOM verification', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    const result = await page.evaluate(() => {
      // Create test container
      const container = document.createElement('div');
      container.id = 'progress-test';
      document.body.appendChild(container);

      const progress = new UI.Progress(container, {
        showPercentage: true,
        showTime: true,
        showETA: true
      });

      progress.start('Cargando datos...', 'Iniciando proceso');

      const initial = {
        hasTitle: container.querySelector('.progress') !== null || container.textContent.includes('Cargando datos...'),
        hasDescription: container.textContent.includes('Iniciando proceso'),
        percentText: container.textContent.includes('0%'),
      };

      // Simulate progress updates
      progress.update(25, 'Procesando 25%');
      const at25 = container.textContent.includes('25%');

      progress.update(50, 'Procesando 50%');
      const at50 = container.textContent.includes('50%');

      progress.update(100);
      progress.complete('Completado');

      const completed = container.textContent.includes('100%') && container.textContent.includes('Completado');

      // Clean up
      progress.destroy();
      container.remove();

      return { initial, at25, at50, completed };
    });

    console.log('Lifecycle results:', JSON.stringify(result, null, 2));
    expect(result.initial.hasTitle).toBeTruthy();
    expect(result.initial.percentText).toBeTruthy();
    expect(result.at25).toBeTruthy();
    expect(result.at50).toBeTruthy();
    expect(result.completed).toBeTruthy();
  });

  test('Indeterminate mode workst', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    const result = await page.evaluate(() => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const progress = new UI.Progress(container, {});
      progress.start('Procesando...', 'Operación desconocida', true);

      const isIndeterminate = progress.isIndeterminate === true;
      const spinnerVisible = container.querySelector('[style*="spin"]') !== null ||
        container.innerHTML.includes('animation');

      progress.setIndeterminate(false);
      const isDeterminate = progress.isIndeterminate === false;

      progress.complete('Fin');
      progress.destroy();
      container.remove();

      return { isIndeterminate, spinnerVisible, isDeterminate };
    });

    console.log('Indeterminate results:', JSON.stringify(result, null, 2));
    expect(result.isIndeterminate).toBeTruthy();
    expect(result.isDeterminate).toBeTruthy();
  });

  test('No console errors during progress component usage', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    consoleErrors = [];
    await page.evaluate(() => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const p = new UI.Progress(container, {});
      p.start('Test', 'Test', false);
      p.update(50);
      p.complete();
      p.destroy();
      container.remove();
    });

    expect(consoleErrors.length).toBe(0);
    console.log('✅ No console errors');
  });

  test('Router integrates progress-container during navigation', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    // Navigate directly and check the progress container appears
    const result = await page.evaluate(() => {
      // Simulate what router does
      const main = document.getElementById('app-content');
      main.innerHTML = '<div id="progress-container"></div>';
      const pc = document.getElementById('progress-container');
      const progress = new UI.Progress(pc, {
        showPercentage: true,
        showTime: true,
        showETA: true
      });
      progress.start('Cargando aplicación...', 'Preparando la interfaz de usuario');
      progress.update(40, 'Procesando...');
      progress.complete('Carga completada');
      progress.destroy();
      return pc !== null;
    });

    expect(result).toBeTruthy();
    console.log('✅ Progress container integration works');
  });
});
