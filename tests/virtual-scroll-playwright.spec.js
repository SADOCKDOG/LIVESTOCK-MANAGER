/**
 * Playwright E2E tests for UI.VirtualScroller (Task #5)
 * Validates virtual scrolling for large lists: only visible items render,
 * variable heights are handled, and the class is wired into the list views.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8874;
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

test.describe('UI.VirtualScroller Component - Task #5', () => {
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

  test('VirtualScroller class is defined and accessible', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    const has = await page.evaluate(() =>
      typeof UI !== 'undefined' && typeof UI.VirtualScroller === 'function'
    );
    expect(has).toBe(true);
  });

  test('VirtualScroller only renders visible items (with buffer) for large lists', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    const result = await page.evaluate(() => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const vs = new UI.VirtualScroller(host, 40, {
        buffer: 3,
        height: '400px',
        renderItem: (label, i) => {
          const el = document.createElement('div');
          el.style.height = '40px';
          el.setAttribute('data-vs-item', '1');
          el.textContent = `item-${i}`;
          return el;
        },
      });
      const items = Array.from({ length: 1000 }, (_, i) => i);
      vs.setItems(items);

      const renderedCount = host.querySelectorAll('[data-vs-item]').length;
      const totalHeight = vs._getTotalHeight();
      const visible = vs.getVisibleRange();
      vs.destroy();
      host.remove();

      return { renderedCount, totalHeight, visible };
    });

    // Should render far fewer than 1000 items (viewport + buffer only)
    expect(result.renderedCount).toBeLessThan(40);
    expect(result.totalHeight).toBe(1000 * 40);
    expect(result.visible).toHaveProperty('start');
    expect(result.visible).toHaveProperty('end');
  });

  test('VirtualScroller handles variable-height items without overlap', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    const result = await page.evaluate(() => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      let calls = 0;
      const vs = new UI.VirtualScroller(host, 40, {
        buffer: 5,
        height: '400px',
        renderItem: (label, i) => {
          calls++;
          const h = 40 + (i % 3) * 20; // 40 / 60 / 80 px alternating
          const el = document.createElement('div');
          el.style.height = h + 'px';
          el.dataset.idx = i;
          el.textContent = `item-${i}`;
          return el;
        },
      });
      const items = Array.from({ length: 200 }, (_, i) => i);
      vs.setItems(items);

      // Measure positions of consecutive rendered items to ensure no overlap
      const nodes = Array.from(host.querySelectorAll('[data-idx]'));
      const tops = nodes.map(n => parseFloat(n.style.top || '0'));
      let overlaps = 0;
      for (let i = 1; i < tops.length; i++) {
        const prevH = nodes[i - 1].offsetHeight;
        if (tops[i] < tops[i - 1] + prevH - 1) overlaps++;
      }
      const totalHeight = vs._getTotalHeight();
      vs.destroy();
      host.remove();

      return { calls, overlaps, totalHeight, nodeCount: nodes.length };
    });

    expect(result.overlaps).toBe(0);
    expect(result.calls).toBeLessThan(200);
    expect(result.totalHeight).toBeGreaterThan(200 * 40);
  });

  test('VirtualScroller setItems updates rendered list', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    const result = await page.evaluate(() => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const vs = new UI.VirtualScroller(host, 40, {
        buffer: 3,
        height: '400px',
        renderItem: (label, i) => {
          const el = document.createElement('div');
          el.style.height = '40px';
          el.textContent = label;
          return el;
        },
      });
      vs.setItems(Array.from({ length: 100 }, (_, i) => 'a' + i));
      const first = host.textContent.indexOf('a0');
      vs.setItems(Array.from({ length: 50 }, (_, i) => 'b' + i));
      const hasB = host.textContent.indexOf('b0');
      const hasA = host.textContent.indexOf('a0');
      vs.destroy();
      host.remove();
      return { first, hasB, hasA };
    });

    expect(result.first).toBeGreaterThan(-1);
    expect(result.hasB).toBeGreaterThan(-1);
    expect(result.hasA).toBe(-1);
  });

  test('No console errors during VirtualScroller usage', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof UI !== "undefined"', { timeout: 30000 });

    await page.evaluate(() => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const vs = new UI.VirtualScroller(host, 40, {
        buffer: 3,
        height: '400px',
        renderItem: (l, i) => {
          const el = document.createElement('div');
          el.style.height = '40px';
          return el;
        },
      });
      vs.setItems(Array.from({ length: 500 }, (_, i) => i));
      vs.destroy();
      host.remove();
    });

    const fatal = consoleErrors.filter(e =>
      /TypeError|ReferenceError|SyntaxError|is not a function|is not defined/.test(e)
    );
    expect(fatal).toEqual([]);
  });

  test('AnimalesView and RebanosView wire VirtualScroller into their list containers', async () => {
    // Static verification: the view files must reference UI.VirtualScroller and its
    // virtual container. (The globals only exist after navigating to each view.)
    const animalesSrc = fs.readFileSync(path.join(PROJECT_ROOT, 'js/views/animales-view.js'), 'utf8');
    const rebanosSrc = fs.readFileSync(path.join(PROJECT_ROOT, 'js/views/rebanos-view.js'), 'utf8');
    const uiSrc = fs.readFileSync(path.join(PROJECT_ROOT, 'js/ui-utils.js'), 'utf8');

    expect(uiSrc).toContain('VirtualScroller: class');
    expect(animalesSrc).toContain('new window.UI.VirtualScroller');
    expect(animalesSrc).toContain('_animalesVirtualScroller');
    expect(rebanosSrc).toContain('new window.UI.VirtualScroller');
    expect(rebanosSrc).toContain('_rebanosVirtualScroller');
  });
});
