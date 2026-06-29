/**
 * Captura + Inserción de datos desde WebView via ADB CDP
 * 1. Conecta al WebView de la app
 * 2. Carga la demo (SeedData.run())
 * 3. Navega e interactúa con cada sección
 * 4. Captura screenshots con datos reales
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

const dirs = ['compr', 'prov', 'trans', 'anim', 'contr', 'san', 'rep'];
dirs.forEach(dir => {
  const dirPath = path.join(SCREENSHOTS_DIR, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

const wait = ms => new Promise(r => setTimeout(r, ms));

async function getActivePid() {
  try {
    const unix = execSync('adb -s 485abd240000 shell cat /proc/net/unix 2>/dev/null', { encoding: 'utf8' });
    const match = unix.match(/webview_devtools_remote_(\d+)/);
    if (match) return match[1];
  } catch (e) {}
  return null;
}

async function connect() {
  const pid = await getActivePid();
  if (!pid) throw new Error('No se encontró WebView activo');

  execSync(`adb -s 485abd240000 forward --remove tcp:9222 2>/dev/null || true`, { stdio: 'pipe' });
  execSync(`adb -s 485abd240000 forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);

  const client = await CDP({ port: 9222, timeout: 10000 });
  console.log(`✅ Conectado al WebView (PID ${pid})\n`);
  return client;
}

async function js(Runtime, code) {
  const result = await Runtime.evaluate({ expression: code, awaitPromise: true, timeout: 10000 });
  return result?.result?.value;
}

async function navigate(Page, Runtime, hash) {
  await js(Runtime, `window.location.hash = '#${hash}'`);
  await wait(1500);
}

async function screenshot(Page, filePath) {
  const { data } = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
}

// Plan de capturas: [ ruta, acción extra, nombre ]
const plan = [
  // COMPRADORES
  { file: 'compr/compr-01.png', hash: '/compradores', name: 'Compradores - listado',
    action: null },
  { file: 'compr/compr-02.png', hash: '/compradores', name: 'Compradores - abrir formulario',
    action: `document.querySelector('button[class*="fab"], .fab, button[aria-label*="nuevo"], button[aria-label*="añadir"]')?.click()` },
  { file: 'compr/compr-03.png', hash: '/compradores', name: 'Compradores - formulario relleno',
    action: `(()=>{
      const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
      if(inputs[0]) { inputs[0].value='Cárnicas del Sur SL'; inputs[0].dispatchEvent(new Event('input',{bubbles:true})); }
      if(inputs[1]) { inputs[1].value='B87654321'; inputs[1].dispatchEvent(new Event('input',{bubbles:true})); }
    })()` },
  { file: 'compr/compr-04.png', hash: '/compradores', name: 'Compradores - detalle Cárnicas',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[0]?.click()` },
  { file: 'compr/compr-05.png', hash: '/compradores', name: 'Compradores - historial ventas',
    action: `window.scrollTo(0, 500)` },
  { file: 'compr/compr-06.png', hash: '/compradores', name: 'Compradores - Lácteos detalle',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[1]?.click()` },
  { file: 'compr/compr-07.png', hash: '/compradores', name: 'Compradores - contratos',
    action: `window.scrollTo(0, 800)` },
  { file: 'compr/compr-08.png', hash: '/compradores', name: 'Compradores - KPIs',
    action: `window.scrollTo(0, 0)` },

  // PROVEEDORES
  { file: 'prov/prov-01.png', hash: '/proveedores', name: 'Proveedores - listado', action: null },
  { file: 'prov/prov-02.png', hash: '/proveedores', name: 'Proveedores - nuevo',
    action: `document.querySelector('button[class*="fab"], .fab, button[aria-label*="nuevo"]')?.click()` },
  { file: 'prov/prov-03.png', hash: '/proveedores', name: 'Proveedores - formulario',
    action: `window.scrollTo(0, 300)` },
  { file: 'prov/prov-04.png', hash: '/proveedores', name: 'Proveedores - Piensos El Trébol',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[0]?.click()` },
  { file: 'prov/prov-05.png', hash: '/proveedores', name: 'Proveedores - historial gastos',
    action: `window.scrollTo(0, 500)` },
  { file: 'prov/prov-06.png', hash: '/proveedores', name: 'Proveedores - VetPlus',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[1]?.click()` },
  { file: 'prov/prov-07.png', hash: '/proveedores', name: 'Proveedores - Maquinaria',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[2]?.click()` },
  { file: 'prov/prov-08.png', hash: '/proveedores', name: 'Proveedores - KPIs',
    action: `window.scrollTo(0, 0)` },

  // TRANSPORTISTAS
  { file: 'trans/trans-01.png', hash: '/transportistas', name: 'Transportistas - listado', action: null },
  { file: 'trans/trans-02.png', hash: '/transportistas', name: 'Transportistas - nuevo',
    action: `document.querySelector('button[class*="fab"], .fab, button[aria-label*="nuevo"]')?.click()` },
  { file: 'trans/trans-03.png', hash: '/transportistas', name: 'Transportistas - tipo vehículo',
    action: `window.scrollTo(0, 200)` },
  { file: 'trans/trans-04.png', hash: '/transportistas', name: 'Transportistas - certificado',
    action: `window.scrollTo(0, 400)` },
  { file: 'trans/trans-05.png', hash: '/transportistas', name: 'Transportistas - Ganaderos Sur',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[0]?.click()` },
  { file: 'trans/trans-06.png', hash: '/transportistas', name: 'Transportistas - Logística Láctea',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[1]?.click()` },
  { file: 'trans/trans-07.png', hash: '/transportistas', name: 'Transportistas - KPIs detalle',
    action: `window.scrollTo(0, 500)` },
  { file: 'trans/trans-08.png', hash: '/transportistas', name: 'Transportistas - KPIs listado',
    action: `window.scrollTo(0, 0)` },

  // ANIMALES Y REBAÑOS
  { file: 'anim/anim-01.png', hash: '/estructura', name: 'Estructura finca', action: null },
  { file: 'anim/anim-02.png', hash: '/zonas',      name: 'Zonas listado', action: null },
  { file: 'anim/anim-03.png', hash: '/rebanos',    name: 'Rebaños listado', action: null },
  { file: 'anim/anim-04.png', hash: '/rebanos',    name: 'Nuevo rebaño',
    action: `document.querySelector('button[class*="fab"], .fab, button[aria-label*="nuevo"]')?.click()` },
  { file: 'anim/anim-05.png', hash: '/animales',   name: 'Animales listado', action: null },
  { file: 'anim/anim-06.png', hash: '/animales',   name: 'Nuevo animal paso 1',
    action: `document.querySelector('button[class*="fab"], .fab, button[aria-label*="nuevo"]')?.click()` },
  { file: 'anim/anim-07.png', hash: '/animales',   name: 'Nuevo animal paso 2',
    action: `window.scrollTo(0, 400)` },
  { file: 'anim/anim-08.png', hash: '/animales',   name: 'Escáner crotal',
    action: `document.querySelector('[class*="scanner"], [aria-label*="scan"], [aria-label*="escan"]')?.click()` },
  { file: 'anim/anim-09.png', hash: '/animales',   name: 'Detalle animal',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[0]?.click()` },
  { file: 'anim/anim-10.png', hash: '/animales',   name: 'Genealogía',
    action: `window.scrollTo(0, 800)` },
  { file: 'anim/anim-11.png', hash: '/animales',   name: 'KPIs animales',
    action: `window.scrollTo(0, 0)` },

  // CONTRATOS
  { file: 'contr/contr-01.png', hash: '/compradores', name: 'Contratos panel',
    action: `(()=>{ const el = document.querySelectorAll('.list-item, .card, [class*="item"]')[0]; el?.click(); })(); window.scrollTo(0,600)` },
  { file: 'contr/contr-02.png', hash: '/compradores', name: 'Nuevo contrato',
    action: `document.querySelector('[class*="contrato"] button, button[aria-label*="contrato"]')?.click()` },
  { file: 'contr/contr-03.png', hash: '/compradores', name: 'Tabla precios',
    action: `window.scrollTo(0, 1000)` },

  // SANITARIOS
  { file: 'san/san-01.png', hash: '/rebanos', name: 'Sanitarios listado',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[0]?.click()` },
  { file: 'san/san-02.png', hash: '/rebanos', name: 'Nuevo sanitario',
    action: `document.querySelector('button[class*="fab"], .fab, [aria-label*="sanitario"]')?.click()` },
  { file: 'san/san-03.png', hash: '/rebanos', name: 'Tipos tratamiento',
    action: `window.scrollTo(0, 300)` },
  { file: 'san/san-04.png', hash: '/rebanos', name: 'Registro alerta',
    action: `window.scrollTo(0, 600)` },
  { file: 'san/san-05.png', hash: '/rebanos', name: 'Historial sanitario',
    action: `window.scrollTo(0, 900)` },

  // REPRODUCCIÓN
  { file: 'rep/rep-01.png', hash: '/animales', name: 'Reproducción timeline',
    action: `document.querySelectorAll('.list-item, .card, [class*="item"]')[0]?.click()` },
  { file: 'rep/rep-02.png', hash: '/animales', name: 'Nuevo evento',
    action: `document.querySelector('[aria-label*="evento"], [class*="evento"] button')?.click()` },
  { file: 'rep/rep-03.png', hash: '/animales', name: 'Tipos evento',
    action: `window.scrollTo(0, 400)` },
  { file: 'rep/rep-04.png', hash: '/animales', name: 'Ciclo completo',
    action: `window.scrollTo(0, 700)` },
  { file: 'rep/rep-05.png', hash: '/animales', name: 'Árbol genealógico',
    action: `window.scrollTo(0, 1000)` },
];

async function main() {
  console.log('🚀 Captura con datos desde WebView\n');

  // Puerto 9222 ya configurado externamente
  let client;
  try {
    client = await CDP({ port: 9222, timeout: 10000 });
    console.log('✅ Conectado al WebView\n');
  } catch (e) {
    console.error('❌ Error conectando:', e.message);
    process.exit(1);
  }

  const { Page, Runtime, Emulation } = client;
  await Page.enable();
  await Runtime.enable();

  // Tamaño del teléfono
  await Emulation.setDeviceMetricsOverride({
    width: 1080, height: 2176, deviceScaleFactor: 2.75, mobile: true
  });

  // Cargar demo
  console.log('📦 Cargando demo CHAMORRO...');
  await navigate(Page, Runtime, '/');
  await wait(1000);

  const seedResult = await js(Runtime, `
    (async () => {
      if (window.SeedData && window.SeedData.run) {
        await window.SeedData.run();
        return 'ok';
      }
      return 'no-seed';
    })()
  `);
  console.log(`✅ Demo: ${seedResult || 'cargada'}\n`);
  await wait(2000);

  // Capturar
  console.log('📷 Capturando...\n');
  let ok = 0;

  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    const filePath = path.join(SCREENSHOTS_DIR, p.file);

    process.stdout.write(`[${String(i + 1).padStart(2)}/48] ${p.name.padEnd(32)} `);

    try {
      await navigate(Page, Runtime, p.hash);

      if (p.action) {
        await js(Runtime, p.action);
        await wait(800);
      }

      await screenshot(Page, filePath);
      console.log('✅');
      ok++;
    } catch (e) {
      console.log(`❌ ${e.message?.substring(0, 30) || e}`);
    }

    await wait(300);
  }

  console.log(`\n✅ Completado: ${ok}/48`);
  console.log(`📁 www/manual/img/\n`);

  await client.close();
}

main();
