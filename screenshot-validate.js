const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/www';
const PORT = 8095;
const BASE = `http://localhost:${PORT}`;
// Playwright limpia test-results/ en cada corrida, así que la evidencia vive
// fuera de esa carpeta para no perderse al ejecutar la suite.
const OUT = 'C:/Users/yo/repo/LIVESTOCK-MANAGER/evidencias';

function startServer() {
  const http = require('http');
  const mime = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json' };
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

async function seedDemo(page) {
  await page.evaluate(async () => {
    if (typeof App === 'undefined') return;
    const db = window.db;
    const rebaños = await db.getAll('rebanos').catch(() => []);
    let leche, carne;
    if (rebaños.length >= 2) {
      leche = rebaños.find(r => (r.tipo||'').includes('leche')) || rebaños[0];
      carne = rebaños.find(r => (r.tipo||'').includes('carne')) || rebaños[1];
    } else {
      leche = await db.add('rebanos', { nombre: 'Vacas Leche CHAMORRO', tipo: 'leche', tipo_explotacion_rega: 'LEQUE', estado: 'activo', fincaId: 1, fecha_constitucion: '2023-05-10' });
      carne = await db.add('rebanos', { nombre: 'Cebo Terneros CHAMORRO', tipo: 'carne', estado: 'activo', fincaId: 1, fecha_constitucion: '2024-01-15' });
    }
    // Seed a large population so virtualization is clearly exercised.
    const animales = await db.getAll('animales').catch(() => []);
    const names = ['VACA','TERNERO','NOVILLO','TORO','OVeja','CABRA'];
    if (animales.length < 120) {
      for (let i = 0; i < 260; i++) {
        const esLeche = i % 2 === 0;
        const cr = esLeche ? leche : carne;
        const base = (esLeche ? 'L' : 'C') + String(i+1).padStart(4, '0');
        await db.add('animales', {
          identificacion: base,
          nombre: `Animal ${base} ${names[i % names.length]}`,
          sexo: i % 2 ? 'Hembra' : 'Macho',
          tipo: esLeche ? 'leche' : 'carne',
          rebanoId: cr.id,
          estado: 'activo',
          fecha_nacimiento: '2020-01-01',
          peso: 450 + (i % 120),
          precio_estimado: 900 + (i % 300)
        });
      }
    }
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message));

  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('typeof App !== "undefined" && typeof UI !== "undefined"', { timeout: 30000 });
  console.log('App booted');

  // Disable interactive guides so they never block the screenshots.
  await page.evaluate(() => {
    if (window.App) {
      App._config = App._config || {};
      App._config.guides = App._config.guides || {};
      App._config.guides.enabled = false;
    }
  });

  // Remove any residual guide overlay nodes that may already be in the DOM.
  const dismissGuides = async () => {
    await page.evaluate(() => {
      try {
        if (window.GuideManager && typeof GuideManager.dismiss === 'function') GuideManager.dismiss();
        if (window.GuideManager && typeof GuideManager._hideResumeChip === 'function') GuideManager._hideResumeChip();
      } catch (e) {}
      // Ocultar permanentemente el chip de reanudar y cualquier overlay residual.
      // El chip se crea dinamicamente al navegar, asi que tambien se elimina bajo demanda
      // con un MutationObserver que lo quita en cuanto aparezca.
      if (!window.__guideResidueHooked) {
        window.__guideResidueHooked = true;
        const st = document.createElement('style');
        st.textContent = '.guide-resume-chip,.guide-overlay,.guide-popover,.guide-spotlight{display:none!important;}';
        document.head.appendChild(st);
        new MutationObserver(() => {
          const chip = document.getElementById('guide-resume-chip');
          if (chip) chip.remove();
          document.querySelectorAll('body *').forEach(n => {
            const cs = getComputedStyle(n);
            if ((cs.position === 'fixed' || cs.position === 'absolute') &&
                (parseInt(cs.zIndex, 10) || 0) >= 4000) {
              n.remove();
            }
          });
        }).observe(document.body, { childList: true, subtree: true });
      }
      document.getElementById('guide-resume-chip')?.remove();
      document.querySelectorAll('.guide-overlay, .guide-popover, .guide-resume-chip, .guide-spotlight')
        .forEach(n => n.remove());
      // El chip de reanudar lleva z-index alto (4500): barrer cualquier flotante
      // con z-index >= 4000 elimina el residuo del tour sin depender de ids.
      document.querySelectorAll('body *').forEach(n => {
        const cs = getComputedStyle(n);
        if ((cs.position === 'fixed' || cs.position === 'absolute') &&
            (parseInt(cs.zIndex, 10) || 0) >= 4000) {
          n.remove();
        }
      });
    });
    await page.waitForTimeout(250);
  };

  // Load the demo seed (SeedData / Cargar Demo) by clicking the button if present
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demo = btns.find(b => /CHAMORRO/i.test(b.textContent) || /demo/i.test(b.textContent) && /cargar/i.test(b.textContent));
    if (demo) demo.click();
  });
  await page.waitForTimeout(800);

  // Accept the "CARGAR DEMO" confirmation modal
  const accepted = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const ok = btns.find(b => /ACEPTAR/i.test(b.textContent));
    if (ok) ok.click();
    return !!ok;
  });
  console.log('Demo accept clicked:', accepted);

  // Seed a large population directly, then reload so the views read fresh data.
  await seedDemo(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction('typeof App !== "undefined" && typeof UI !== "undefined"', { timeout: 30000 });
  await page.evaluate(() => {
    if (window.App) {
      App._config = App._config || {};
      App._config.guides = App._config.guides || {};
      App._config.guides.enabled = false;
    }
  });
  await page.waitForTimeout(1500);

  // Wait for the demo seed long operation to finish (loading panel disappears).
  await page.waitForFunction(() => {
    const body = document.body.innerText || '';
    return !/Cargando datos de la demo/i.test(body) && !/Cargando\.\.\./i.test(body);
  }, { timeout: 30000 }).catch(() => console.log('demo-load panel did not clear'));
  await page.waitForTimeout(1500);

  // Navigate to Animales view
  await page.evaluate(() => { location.hash = '#/animales'; });
  await page.waitForSelector('#animales-lista', { state: 'attached', timeout: 30000 });
  await page.waitForTimeout(2000);

  await dismissGuides();
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(OUT, 'animales-view.png'), fullPage: false });
  console.log('Captured animales-view.png');

  // Scroll the virtual scroller to its list area and capture the visible cards.
  const animalesVS = await page.$('#animales-lista');
  if (animalesVS) {
    await animalesVS.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#animales-lista').screenshot({ path: path.join(OUT, 'animales-card-region.png') });
    console.log('Captured animales-card-region.png');
  }

  // Check virtual scroller wiring in animales
  const animalesDiag = await page.evaluate(() => {
    const host = document.getElementById('animales-lista');
    const vs = typeof AnimalesView !== 'undefined' ? AnimalesView._animalesVirtualScroller : null;
    return {
      hasHost: !!host,
      hasScroller: !!vs,
      childCount: host ? host.querySelectorAll('[data-vs-item], .card-registro').length : -1,
      totalHeight: vs ? vs._getTotalHeight() : -1,
      totalItems: vs ? vs.items.length : -1
    };
  });
  console.log('Animales diag:', JSON.stringify(animalesDiag));

  // Navigate to Rebaños view
  await page.evaluate(() => { location.hash = '#/rebanos'; });
  await page.waitForSelector('#rebanos-vs-container', { state: 'attached', timeout: 30000 });
  await page.waitForTimeout(2000);

  await dismissGuides();
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(OUT, 'rebanos-view.png'), fullPage: false });
  console.log('Captured rebanos-view.png');

  const rebanosVS = await page.$('#rebanos-vs-container');
  if (rebanosVS) {
    await rebanosVS.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#rebanos-vs-container').screenshot({ path: path.join(OUT, 'rebanos-card-region.png') });
    console.log('Captured rebanos-card-region.png');
  }

  const rebanosDiag = await page.evaluate(() => {
    const host = document.getElementById('rebanos-vs-container');
    const vs = typeof RebanosView !== 'undefined' ? RebanosView._rebanosVirtualScroller : null;
    return {
      hasHost: !!host,
      hasScroller: !!vs,
      childCount: host ? host.querySelectorAll('.card-registro, [data-vs-item]').length : -1,
      totalItems: vs ? vs.items.length : -1
    };
  });
  console.log('Rebanos diag:', JSON.stringify(rebanosDiag));

  await browser.close();
  server.close();
  console.log('DONE');
})();
