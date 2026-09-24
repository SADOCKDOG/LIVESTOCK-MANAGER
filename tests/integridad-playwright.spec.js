/**
 * Playwright E2E tests for referential integrity (Task #3).
 *
 * Verifica el comportamiento REAL de integridad referencial al eliminar:
 * - Una finca con rebaños asociados NO se puede borrar y lanza un mensaje claro.
 * - Una finca sin rebaños sí se borra.
 * - Los helpers de ErrorHandler (validateEntityExists / handleConstraintError)
 *   existen y validateEntityExists lanza AppError NOT_FOUND con un id inexistente.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8879;
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
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction('!!window.App', { timeout: 30000 });
  await page.waitForTimeout(1200);
}

test.describe('Integridad referencial al eliminar (Tarea #3)', () => {
  let server, browser, context, page;
  let consoleErrors = [];

  test.beforeAll(async () => {
    server = await startServer();
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    page = await context.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(err.message));
    await seed(page);
  });

  test.afterAll(async () => {
    await browser.close();
    server.close();
  });

  test('Los helpers de ErrorHandler existen (validateEntityExists / handleConstraintError)', async () => {
    const has = await page.evaluate(() => ({
      validateEntityExists: typeof window.ErrorHandler?.validateEntityExists === 'function',
      handleConstraintError: typeof window.ErrorHandler?.handleConstraintError === 'function',
    }));
    expect(has.validateEntityExists).toBe(true);
    expect(has.handleConstraintError).toBe(true);
  });

  test('Una finca CON rebaños NO se puede eliminar y sigue existiendo', async () => {
    const res = await page.evaluate(async () => {
      const fincas = await window.db.getAll('fincas');
      let conRebanos = null;
      for (const f of fincas) {
        const rb = await window.db.getAllFromIndex('rebanos', 'fincaId', Number(f.id));
        if (rb.length > 0) { conRebanos = f; break; }
      }
      if (!conRebanos) return { skip: true };
      let mensaje = null;
      try { await window.Fincas.delete(conRebanos.id); }
      catch (e) { mensaje = e.message; }
      const sigue = await window.db.get('fincas', Number(conRebanos.id));
      return { fincaId: conRebanos.id, mensaje, sigueExistiendo: !!sigue };
    });

    expect(res.skip).toBeFalsy();
    expect(res.mensaje).toContain('rebaños asociados');
    expect(res.sigueExistiendo).toBe(true);
  });

  test('Una finca SIN rebaños sí se elimina', async () => {
    const res = await page.evaluate(async () => {
      const nuevaId = await window.db.add('fincas', {
        nombre: 'TEST-BORRADO-' + Date.now(),
        creadoEn: new Date().toISOString(),
      });
      let borrado = false, error = null;
      try { await window.Fincas.delete(nuevaId); borrado = true; }
      catch (e) { error = e.message; }
      const sigue = await window.db.get('fincas', Number(nuevaId));
      return { borrado, error, sigueExistiendo: !!sigue };
    });

    expect(res.error).toBeNull();
    expect(res.borrado).toBe(true);
    expect(res.sigueExistiendo).toBe(false);
  });

  test('validateEntityExists lanza AppError NOT_FOUND con un id inexistente', async () => {
    const res = await page.evaluate(async () => {
      try {
        await window.ErrorHandler.validateEntityExists('Finca', 999999999, (id) => window.db.get('fincas', id));
        return { lanzo: false };
      } catch (e) {
        return { lanzo: true, type: e.type, mensaje: e.message };
      }
    });
    expect(res.lanzo).toBe(true);
    expect(res.type).toBe('NOT_FOUND');
    expect(res.mensaje).toContain('no encontrado');
  });

  test('Sin errores JS fatales durante las pruebas de integridad', async () => {
    const fatal = consoleErrors.filter(e =>
      /TypeError|ReferenceError|SyntaxError|is not a function|is not defined/i.test(e)
    );
    expect(fatal).toEqual([]);
  });
});
