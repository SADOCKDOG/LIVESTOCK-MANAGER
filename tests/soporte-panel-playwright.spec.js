/**
 * Playwright E2E tests for the support panel (Task #19).
 * Validates two commits:
 *   · 59d1e1d — pie «Soporte» en el sidebar + cajón acoplado y MINIMIZABLE.
 *   · e4a7736 — estados con color (badge variants) y botones del módulo en su sitio.
 *
 * The pie mounts into #sidebarStatus; the drawer is #sp-panel and its minimized
 * form is the floating bar #sp-min. The state chart (label + counter + license)
 * is driven via SoportePanel and persisted in localStorage.
 *
 * NOTE: erp-shell.js guarda la capa con `matchMedia('(min-width: 1024px)')`, así
 * que el sidebar (y por tanto el pie y el cajón) SOLO existe por encima de
 * 1024px. El contexto de navegación usa un viewport de escritorio (1280x900).
 * Se interactúa por DOM (element.click()) y se verifican clases en lugar de
 * strings de display, que es determinista y estable.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8876;
const BASE_URL = `http://localhost:${PORT}`;

function startServer() {
  const http = require('http');
  const mime = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.mjs': 'text/javascript',
    '.webmanifest': 'application/manifest+json',
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

// Clicks a DOM node by selector (deterministic; avoids pointer/hover flakiness
// on tiny fixed buttons).
async function clickDom(page, selector) {
  const ok = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    el.click();
    return true;
  }, selector);
  expect(ok).toBe(true);
}

async function seed(page) {
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('typeof App !== "undefined" && typeof UI !== "undefined"', { timeout: 30000 });
  await page.evaluate(async () => {
    const id = await Fincas.getActiveId().catch(() => null);
    if (!id) {
      if (window.AsistenteConfiguracion?._ensureSeedData) await AsistenteConfiguracion._ensureSeedData();
      if (window.SeedData?.run) await SeedData.run(true);
    }
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction('!!window.App', { timeout: 30000 });
  await page.waitForTimeout(1500);
  // A route renders the ERP shell + sidebar.
  await page.evaluate(() => { location.hash = '#/ganaderia'; });
  await page.waitForTimeout(800);
}

test.describe('Soporte panel minimizable + pie sidebar (Tarea #19)', () => {
  let server, browser, context, page;
  let consoleErrors = [];

  test.beforeAll(async () => {
    server = await startServer();
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    // >=1024px: por debajo erp-shell.js no instala la capa (sin sidebar ni pie).
    context = await browser.newContext({ viewport: { width: 1280, height: 900 }, isMobile: false });
    page = await context.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(err.message));
    await seed(page);
  });

  test.afterAll(async () => {
    await browser.close();
    server.close();
  });

  test('SoportePanel está definido y el pie «Soporte» se monta en el sidebar', async () => {
    const diag = await page.evaluate(() => ({
      hasPanel: typeof window.SoportePanel === 'object',
      hasPie: !!document.querySelector('#sidebarStatus .sp-pie'),
      pieLabel: document.querySelector('#sidebarStatus .sp-pie .sp-pie-rotulo')?.textContent || '',
      estado: document.querySelector('#sidebarStatus .sp-pie .sp-pie-estado')?.textContent || '',
    }));
    expect(diag.hasPanel).toBe(true);
    expect(diag.hasPie).toBe(true);
    expect(diag.pieLabel.trim().toLowerCase()).toBe('soporte');
    // Debe indicar «Con licencia» o «Sin licencia», nunca vacío.
    expect(diag.estado).toMatch(/licencia/i);
  });

  test('Clic en el pie abre el cajón #sp-panel', async () => {
    await clickDom(page, '#sidebarStatus .sp-pie');
    await page.waitForTimeout(200);
    const diag = await page.evaluate(() => {
      const panel = document.getElementById('sp-panel');
      return {
        existe: !!panel,
        visible: !!panel && !panel.classList.contains('oculto'),
        titulo: panel?.querySelector('.sp-cab-titulo')?.textContent?.trim() || '',
        tabs: panel?.querySelectorAll('.sp-tab').length || 0,
      };
    });
    expect(diag.existe).toBe(true);
    expect(diag.visible).toBe(true);
    expect(diag.titulo.toLowerCase()).toContain('soporte');
    expect(diag.tabs).toBe(2); // «Nueva incidencia» + «Mis incidencias»
  });

  test('El botón Minimizar oculta el cajón y muestra la barra flotante #sp-min', async () => {
    // Asegurar abierto
    await clickDom(page, '#sidebarStatus .sp-pie');
    await page.waitForTimeout(150);
    await clickDom(page, '#sp-btn-min');
    await page.waitForTimeout(150);
    const diag = await page.evaluate(() => {
      const min = document.getElementById('sp-min');
      return {
        panelOculto: document.getElementById('sp-panel')?.classList.contains('oculto') || false,
        minExists: !!min,
        minOn: !!min && min.classList.contains('on'),
        minVisib: !!min && getComputedStyle(min).display !== 'none',
        localStorage: localStorage.getItem('lm_soporte_panel'),
      };
    });
    expect(diag.panelOculto).toBe(true);
    expect(diag.minExists).toBe(true);
    expect(diag.minOn).toBe(true);
    expect(diag.minVisib).toBe(true);
    expect(diag.localStorage).toBe('min'); // recuerda el estado minimizado
  });

  test('Clic en la barra flotante vuelve a abrir el cajón', async () => {
    await clickDom(page, '#sp-min');
    await page.waitForTimeout(200);
    const diag = await page.evaluate(() => ({
      panelVisible: !!document.getElementById('sp-panel') &&
        !document.getElementById('sp-panel').classList.contains('oculto'),
      minOculto: !document.getElementById('sp-min') ||
        getComputedStyle(document.getElementById('sp-min')).display === 'none',
      localStorage: localStorage.getItem('lm_soporte_panel'),
    }));
    expect(diag.panelVisible).toBe(true);
    expect(diag.minOculto).toBe(true);
    expect(diag.localStorage).toBe('open');
  });

  test('El botón Cerrar oculta el cajón y la barra', async () => {
    await clickDom(page, '#sp-btn-cerrar');
    await page.waitForTimeout(150);
    const diag = await page.evaluate(() => ({
      panelOculto: document.getElementById('sp-panel')?.classList.contains('oculto') || false,
      minOculto: !document.getElementById('sp-min') ||
        getComputedStyle(document.getElementById('sp-min')).display === 'none',
    }));
    expect(diag.panelOculto).toBe(true);
    expect(diag.minOculto).toBe(true);
  });

  test('No hay errores JS fatales durante el ciclo abrir/minimizar/cerrar', async () => {
    const fatal = consoleErrors.filter(e =>
      /TypeError|ReferenceError|SyntaxError|is not a function|is not defined/.test(e)
    );
    expect(fatal).toEqual([]);
  });
});
