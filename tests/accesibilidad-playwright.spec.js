/**
 * Playwright E2E tests for accessibility (Task #4) against the REAL rendered DOM.
 *
 * Comprueba que los controles interactivos exponen nombres/roles accesibles:
 * - Sidebar: aria-label del menú, del nav y del botón de plegado; aria-expanded.
 * - El plegado del sidebar actualiza aria-expanded al interactuar.
 * - Carrusel de submódulos (móvil): role=tablist/listbox/option y aria-selected.
 * - Abrir el menú del carrusel actualiza aria-expanded.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8880;
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
  // Cierra el asistente de configuración si quedara abierto (bloquea clics).
  await page.evaluate(() => {
    const c = document.getElementById('asistente-configuracion-contenedor');
    if (c) c.remove();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction('!!window.App', { timeout: 30000 });
  await page.waitForTimeout(1200);
}

test.describe('Accesibilidad del DOM real (Tarea #4)', () => {
  let server, browser, context, page;

  test.beforeAll(async () => {
    server = await startServer();
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await context.newPage();
    await seed(page);
  });

  test.afterAll(async () => {
    await browser.close();
    server.close();
  });

  test('El sidebar expone roles y nombres accesibles', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof App !== "undefined"', { timeout: 30000 });
    await page.waitForTimeout(1500);

    const res = await page.evaluate(() => {
      const aside = document.getElementById('erpSidebar');
      const nav = document.getElementById('erpSidebarNav');
      const toggle = document.getElementById('sidebarToggle');
      return {
        asideLabel: aside?.getAttribute('aria-label') || null,
        navLabel: nav?.getAttribute('aria-label') || null,
        toggleLabel: toggle?.getAttribute('aria-label') || null,
        toggleExpanded: toggle?.getAttribute('aria-expanded') || null,
        currentPageCount: document.querySelectorAll('[aria-current="page"]').length,
      };
    });

    expect(res.asideLabel).toBe('Menú principal');
    expect(res.navLabel).toBe('Navegación de módulos');
    expect(res.toggleLabel).toBeTruthy();
    expect(['true', 'false']).toContain(res.toggleExpanded);
  });

  test('El plegado del sidebar actualiza aria-expanded (interacción real)', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof App !== "undefined"', { timeout: 30000 });
    await page.waitForTimeout(1200);

    // Quita cualquier overlay del asistente que pudiera interceptar el clic.
    await page.evaluate(() => {
      document.getElementById('asistente-configuracion-contenedor')?.remove();
    });

    const before = await page.getAttribute('#sidebarToggle', 'aria-expanded');
    await page.click('#sidebarToggle');
    await page.waitForTimeout(300);
    const after = await page.getAttribute('#sidebarToggle', 'aria-expanded');

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(after).not.toBe(before); // el estado accesible refleja el cambio
  });

  test('El carrusel de submódulos expone role=tablist/listbox/option y aria-selected', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('typeof App !== "undefined" && typeof Icons !== "undefined"', { timeout: 30000 });
    await page.waitForTimeout(1000);

    const res = await page.evaluate(() => {
      const tabs = [
        { key: 'a', icon: '', label: 'Uno', color: '#111' },
        { key: 'b', icon: '', label: 'Dos', color: '#222' },
        { key: 'c', icon: '', label: 'Tres', color: '#333' },
      ];
      const html = App.renderCarruselPestanas(tabs, 'b', 'TestView');
      const host = document.createElement('div');
      host.id = 'a11y-carrusel-host';
      host.innerHTML = html;
      document.body.appendChild(host);

      const tablist = host.querySelector('[role="tablist"]');
      const listbox = host.querySelector('[role="listbox"]');
      const options = host.querySelectorAll('[role="option"]');
      const selected = host.querySelectorAll('[role="option"][aria-selected="true"]');
      const arrows = host.querySelectorAll('.carrusel-flecha[aria-label]');
      const trigger = host.querySelector('[aria-haspopup="listbox"]');

      // Abrir el menú del carrusel y comprobar aria-expanded
      const menuId = trigger?.id ? trigger.id.replace(/-trigger$/, '') : null;
      if (menuId) App.toggleCarruselMenu(menuId);
      const expandedAfter = trigger?.getAttribute('aria-expanded');

      return {
        hasTablist: !!tablist,
        hasListbox: !!listbox,
        optionCount: options.length,
        selectedCount: selected.length,
        arrowLabels: arrows.length,
        hasHaspopup: !!trigger,
        expandedAfter,
      };
    });

    expect(res.hasTablist).toBe(true);
    expect(res.hasListbox).toBe(true);
    expect(res.optionCount).toBe(3);
    expect(res.selectedCount).toBe(1); // solo la pestaña activa
    expect(res.arrowLabels).toBe(2);
    expect(res.hasHaspopup).toBe(true);
    expect(res.expandedAfter).toBe('true');
  });
});
