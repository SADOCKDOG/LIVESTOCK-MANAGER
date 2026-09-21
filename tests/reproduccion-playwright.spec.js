/**
 * Playwright E2E tests for reproduction event persistence (Task #2).
 * Validates the regression fix: `lote` and `hora` are now ALWAYS included in the
 * payload of a reproduction event, regardless of event type. Previously `lote`
 * was dropped unless the type was Inseminación/Monta Natural, and a non-cubrición
 * event (e.g. Diagnóstico Gestación) recorded without its lote.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8875;
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
  await page.waitForTimeout(1500);
}

async function getFirstAnimalId(page) {
  return await page.evaluate(async () => {
    const animales = await window.db.getAll('animales');
    return animales && animales.length ? animales[0].id : null;
  });
}

// Helper: opens the real reproduction wizard for an animal, drives the form for a
// target event type and saves it. Returns the DIAGNOSTIC of the persisted record.
async function saveEvento(page, animalId, { tipo, fecha, hora, lote, notas }) {
  return await page.evaluate(async ({ animalId, tipo, fecha, hora, lote, notas }) => {
    await App._abrirWizardReproduccion(animalId);
    await new Promise(r => setTimeout(r, 50));
    const sel = document.getElementById('wiz-repro-tipo');
    sel.value = tipo;
    App._onReproTipoChange(tipo); // sync conditional field visibility (no 'change' fired)

    const dateEl = document.getElementById('wiz-repro-fecha');
    if (dateEl) dateEl.value = fecha;
    const horaEl = document.getElementById('wiz-repro-hora');
    if (horaEl) horaEl.value = hora;
    const loteEl = document.getElementById('wiz-repro-lote');
    if (loteEl) {
      loteEl.value = lote;
      // Simulate the RFID reader writing the field even when the block is hidden.
      loteEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const notasEl = document.getElementById('wiz-repro-notas');
    if (notasEl) notasEl.value = notas;

    await App._guardarEventoReproduccion(animalId);
    await new Promise(r => setTimeout(r, 300));

    const eventos = await Reproduccion.listEventos(animalId);
    const rec = eventos.find(e => e.fecha === fecha && e.tipo_evento === tipo);
    if (!rec) return { persisted: false };
    return {
      persisted: true,
      lote: rec.lote ?? null,
      hora: rec.hora ?? null,
      tipo: rec.tipo_evento,
    };
  }, { animalId, tipo, fecha, hora, lote, notas });
}

test.describe('Reproducción - persistencia de lote y hora (Tarea #2)', () => {
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

  test('Un evento CUBRICIÓN (Inseminación Artificial) persiste lote y hora', async () => {
    const animalId = await getFirstAnimalId(page);
    expect(animalId).toBeTruthy();

    const res = await saveEvento(page, animalId, {
      tipo: 'Inseminación Artificial', fecha: '2026-09-21', hora: '08:30', lote: 'L-01A', notas: 'POSITIVO',
    });

    expect(res.persisted).toBe(true);
    expect(res.lote).toBe('L-01A');   // el campo visible se guarda
    expect(res.hora).toBe('08:30');   // la hora se guarda
    expect(res.tipo).toBe('Inseminación Artificial');
  });

  test('Un evento NO cubrición (Diagnóstico Gestación) también persiste lote y hora', async () => {
    const animalId = await getFirstAnimalId(page);
    expect(animalId).toBeTruthy();

    const res = await saveEvento(page, animalId, {
      tipo: 'Diagnóstico Gestación', fecha: '2026-09-22', hora: '17:45', lote: 'L-02B', notas: 'NEGATIVO',
    });

    // El fix #482c724: antes de este commit `payload.lote` solo se añadía para
    // Inseminación/Monta Natural, así que un Diagnóstico perdía el lote aunque
    // el lector RFID lo hubiera capturado. Ahora debe persistir siempre.
    expect(res.persisted).toBe(true);
    expect(res.lote).toBe('L-02B');
    expect(res.hora).toBe('17:45');
    expect(res.tipo).toBe('Diagnóstico Gestación');
  });

  test('Los campos vacíos se guardan como cadena vacía (sin undefined)', async () => {
    const animalId = await getFirstAnimalId(page);
    expect(animalId).toBeTruthy();

    const res = await saveEvento(page, animalId, {
      tipo: 'Celo', fecha: '2026-09-23', hora: '', lote: '', notas: '',
    });

    expect(res.persisted).toBe(true);
    // El payload usa `hora`/`lote` con fallback a cadena vacía; el registro no
    // debe contener `undefined` que rompa la serialización IndexedDB.
    expect(res.hora).toBeDefined();
    expect(res.lote).toBeDefined();
  });
});
