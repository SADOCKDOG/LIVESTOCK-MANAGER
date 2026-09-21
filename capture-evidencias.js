/**
 * Capturas de evidencia real (fuera de test-results/, que Playwright limpia).
 *
 *   · progress-render.png .... UI.Progress (tarea #6) en móvil.
 *   · soporte-panel-open.png . Cajón de soporte abierto (tarea #19) en escritorio.
 *   · soporte-panel-min.png .. El mismo cajón minimizado a barra flotante.
 *
 * El cajón de soporte exige viewport >=1024px: erp-shell.js no instala la capa
 * del sidebar por debajo de ese ancho, así que se abre un segundo contexto.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8112;
const BASE = `http://localhost:${PORT}`;
const OUT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/evidencias';

function startServer() {
  const http = require('http');
  const mime = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.pdf': 'application/pdf',
    '.mjs': 'text/javascript', '.webmanifest': 'application/manifest+json',
  };
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.join(PROJECT_ROOT, p);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(PORT, () => resolve(s));
  });
}

async function boot(page) {
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
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
  // Las guías panorámicas montan un modal que taparía las capturas.
  await page.evaluate(() => {
    App._config = App._config || {};
    App._config.guides = App._config.guides || {};
    App._config.guides.enabled = false;
    const st = document.createElement('style');
    st.textContent = '.guide-resume-chip,.guide-overlay,.guide-popover,.guide-spotlight,#tour-flotante-overlay{display:none!important}';
    document.head.appendChild(st);
  });
  await page.waitForTimeout(1200);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });

  // ---- UI.Progress en móvil ----
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const p1 = await mob.newPage();
  p1.on('pageerror', e => console.log('PAGEERR', e.message));
  await boot(p1);
  await p1.evaluate(() => { location.hash = '#/ganaderia'; });
  await p1.waitForTimeout(800);
  const prog = await p1.evaluate(() => {
    const host = document.getElementById('app-content');
    const box = document.createElement('div');
    box.id = 'progress-demo';
    host?.appendChild(box);
    const pr = new window.UI.Progress(box, { showPercentage: true, showTime: true, showETA: true });
    pr.start('Importando datos de la explotación…', 'Procesando registros de ganado');
    pr.update(58, 'Leyendo cultivos SIGPAC', 120);
    return { visible: box.offsetParent !== null, text: (box.innerText || '').slice(0, 160) };
  });
  console.log('UI.Progress:', JSON.stringify(prog));
  await p1.locator('#progress-demo').screenshot({ path: path.join(OUT, 'progress-render.png') });
  console.log('OK progress-render.png');
  await mob.close();

  // ---- Cajón de soporte en escritorio ----
  const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await desk.newPage();
  p2.on('pageerror', e => console.log('PAGEERR', e.message));
  await boot(p2);
  await p2.evaluate(() => { location.hash = '#/ganaderia'; });
  await p2.waitForTimeout(800);

  const pie = await p2.evaluate(() => ({
    hasPie: !!document.querySelector('#sidebarStatus .sp-pie'),
    estado: document.querySelector('#sidebarStatus .sp-pie .sp-pie-estado')?.textContent || '',
  }));
  console.log('Pie sidebar:', JSON.stringify(pie));

  await p2.evaluate(() => { document.querySelector('#sidebarStatus .sp-pie')?.click(); });
  await p2.waitForTimeout(300);
  await p2.evaluate(() => { document.getElementById('guide-fab')?.remove(); });
  await p2.screenshot({ path: path.join(OUT, 'soporte-panel-open.png') });
  console.log('OK soporte-panel-open.png');

  await p2.evaluate(() => { document.getElementById('sp-btn-min').click(); });
  await p2.waitForTimeout(300);
  const min = await p2.evaluate(() => {
    const bar = document.getElementById('sp-min');
    return {
      panelOculto: document.getElementById('sp-panel').classList.contains('oculto'),
      barraVisible: bar.classList.contains('on') && getComputedStyle(bar).display !== 'none',
      ls: localStorage.getItem('lm_soporte_panel'),
    };
  });
  console.log('Minimizado:', JSON.stringify(min));
  await p2.screenshot({ path: path.join(OUT, 'soporte-panel-min.png') });
  console.log('OK soporte-panel-min.png');
  await desk.close();

  await browser.close();
  server.close();
  console.log('DONE');
})();
