/**
 * Auditoría de accesibilidad con axe-core (cierre del residual de contraste de la tarea #4).
 *
 * Recorre las vistas principales (móvil) y el sidebar+panel de soporte (escritorio),
 * ejecuta axe-core con las reglas WCAG 2.1 A/AA y reporta las violaciones reales
 * (id, impacto, nº de nodos y un ejemplo). No afirma "cumple": mide y expone.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8120;
const BASE = `http://localhost:${PORT}`;
const AXE_PATH = require.resolve('axe-core/axe.min.js');

function startServer() {
  const http = require('http');
  const mime = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.mjs': 'text/javascript',
    '.webmanifest': 'application/manifest+json',
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
  await page.evaluate(() => {
    App._config = App._config || {};
    App._config.guides = App._config.guides || {};
    App._config.guides.enabled = false;
    const st = document.createElement('style');
    st.textContent = '.guide-resume-chip,.guide-overlay,.guide-popover,.guide-spotlight,#tour-flotante-overlay{display:none!important}';
    document.head.appendChild(st);
    // Quita el asistente de configuración si quedara abierto (no es parte a auditar).
    document.getElementById('asistente-configuracion-contenedor')?.remove();
  });
  await page.waitForTimeout(1200);
}

async function audit(page, label) {
  await page.addScriptTag({ path: AXE_PATH });
  const res = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      resultTypes: ['violations'],
    });
  });
  const violations = res.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    example: (v.nodes[0]?.target || []).join(' '),
    help: v.help,
    targets: v.nodes.map(n => (n.target || []).join(' ')),
    details: v.nodes.map(n => ({
      target: (n.target || []).join(' '),
      fg: n.any?.[0]?.data?.fgColor,
      bg: n.any?.[0]?.data?.bgColor,
      ratio: n.any?.[0]?.data?.contrastRatio,
      expected: n.any?.[0]?.data?.expectedContrastRatio,
      html: (n.html || '').replace(/\s+/g, ' ').slice(0, 200),
      summary: (n.failureSummary || '').replace(/\n/g, ' '),
    })),
  }));
  console.log(`\n=== ${label} ===`);
  if (!violations.length) {
    console.log('  Sin violaciones WCAG 2.1 A/AA detectadas.');
  } else {
    for (const v of violations) {
      console.log(`  [${v.impact}] ${v.id} x${v.nodes} — ${v.help}`);
      if (v.id === 'color-contrast') {
        for (const d of v.details) {
          console.log(`      · ${d.target} :: fg=${d.fg} bg=${d.bg} ratio=${d.ratio} (min ${d.expected})`);
          console.log(`          html: ${d.html}`);
        }
      } else {
        for (const t of v.targets) console.log(`      · ${t}`);
      }
    }
  }
  return violations;
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const all = {};

  // ---- Móvil: inicio, animales, rebaños ----
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const p1 = await mob.newPage();
  p1.on('pageerror', e => console.log('PAGEERR', e.message));
  await boot(p1);
  for (const [label, hash] of [['inicio', '#/'], ['animales', '#/animales'], ['rebanos', '#/rebanos']]) {
    await p1.evaluate((h) => { location.hash = h; }, hash);
    await p1.waitForTimeout(1800);
    all[`movil:${label}`] = await audit(p1, `móvil — ${label}`);
  }
  await mob.close();

  // ---- Escritorio: sidebar + panel de soporte abierto ----
  const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await desk.newPage();
  p2.on('pageerror', e => console.log('PAGEERR', e.message));
  await boot(p2);
  await p2.evaluate(() => { location.hash = '#/animales'; });
  await p2.waitForTimeout(1500);
  all['escritorio:animales'] = await audit(p2, 'escritorio — animales (sidebar)');

  await p2.evaluate(() => { document.querySelector('#sidebarStatus .sp-pie')?.click(); });
  await p2.waitForTimeout(600);
  all['escritorio:soporte'] = await audit(p2, 'escritorio — panel de soporte');
  await desk.close();

  await browser.close();
  server.close();

  // Resumen
  const totalNodes = Object.values(all).reduce(
    (sum, vs) => sum + vs.reduce((s, v) => s + v.nodes, 0), 0);
  const contrast = Object.entries(all).flatMap(([k, vs]) =>
    vs.filter(v => v.id === 'color-contrast').map(v => ({ vista: k, nodos: v.nodes })));
  console.log('\n=== RESUMEN ===');
  console.log('Nodos con violación (total):', totalNodes);
  console.log('color-contrast:', JSON.stringify(contrast));
  console.log('DONE');
})();
