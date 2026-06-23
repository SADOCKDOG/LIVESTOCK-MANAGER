/**
 * Captura via adb screencap + adb input tap
 * No necesita CDP ni WebSocket - más estable
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEVICE = '485abd240000';
const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

const dirs = ['compr', 'prov', 'trans', 'anim', 'contr', 'san', 'rep'];
dirs.forEach(dir => {
  const dirPath = path.join(SCREENSHOTS_DIR, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

const wait = ms => new Promise(r => setTimeout(r, ms));

function adb(cmd) {
  try {
    return execSync(`adb -s ${DEVICE} ${cmd}`, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
  } catch (e) { return ''; }
}

function screencap(filePath) {
  const result = spawnSync('adb', ['-s', DEVICE, 'exec-out', 'screencap', '-p'], { maxBuffer: 50 * 1024 * 1024 });
  if (result.status === 0 && result.stdout.length > 1000) {
    fs.writeFileSync(filePath, result.stdout);
    return true;
  }
  return false;
}

function tap(x, y) { adb(`shell input tap ${x} ${y}`); }
function swipe(x1, y1, x2, y2) { adb(`shell input swipe ${x1} ${y1} ${x2} ${y2} 300`); }
function back() { /* no-op: evitamos cerrar la app con keyevent 4 */ }

// Coordenadas del menú inferior (ajustadas para la app en dispositivo real)
const NAV = {
  inicio:        () => tap(108, 2100),
  compradores:   () => tap(324, 2100),
  proveedores:   () => tap(540, 2100),
  transportistas:() => tap(756, 2100),
  animales:      () => tap(972, 2100),
};

async function capture(file, setupFn, name) {
  process.stdout.write(`  ${name.padEnd(32)} `);
  try {
    await resetAndOpenModule(file);
    if (setupFn) await setupFn();
    await wait(1000);
    const filePath = path.join(SCREENSHOTS_DIR, file);
    const ok = screencap(filePath);
    console.log(ok ? '✅' : '❌ (sin imagen)');
    return ok;
  } catch (e) {
    console.log(`❌ ${e.message?.substring(0,30)}`);
    return false;
  }
}

async function openApp() {
  adb('shell am start -n com.livestockmanager.app.manual/.MainActivity');
  await wait(1500);
}

async function resetAndOpenModule(file) {
  await openApp();
  const section = file.split('/')[0];
  if (section === 'compr' || section === 'contr') {
    NAV.compradores(); await wait(700);
  } else if (section === 'prov') {
    NAV.proveedores(); await wait(700);
  } else if (section === 'trans') {
    NAV.transportistas(); await wait(700);
  } else if (section === 'anim' || section === 'san' || section === 'rep') {
    NAV.animales(); await wait(700);
  }
}

async function main() {
  console.log('🚀 Captura via ADB screencap\n');
  console.log('📱 Verificando dispositivo...');

  const devices = adb('devices');
  if (!devices.includes(DEVICE)) {
    console.error('❌ Dispositivo no encontrado');
    process.exit(1);
  }
  console.log('✅ Dispositivo OK\n');

  // Abrir app
  console.log('📦 Cargando demo...');
  await openApp();
  screencap(path.join(SCREENSHOTS_DIR, 'test-inicio.png'));
  console.log('✅ App abierta\n');

  let ok = 0, total = 0;

  // ─── COMPRADORES ─────────────────────────────────────────────
  console.log('📂 COMPRADORES');
  total += 8;

  ok += await capture('compr/compr-01.png', async () => {
    NAV.compradores();
  }, 'Listado compradores') ? 1 : 0;

  ok += await capture('compr/compr-02.png', async () => {
    tap(972, 2100); // FAB nuevo
    await wait(500);
  }, 'Nuevo comprador formulario') ? 1 : 0;

  ok += await capture('compr/compr-03.png', async () => {
    swipe(540, 1200, 540, 600); // scroll abajo en formulario
  }, 'Formulario paso 2') ? 1 : 0;

  ok += await capture('compr/compr-04.png', async () => {
    back(); await wait(500); // volver al listado
    tap(540, 600); // click primer item
    await wait(800);
  }, 'Detalle Cárnicas') ? 1 : 0;

  ok += await capture('compr/compr-05.png', async () => {
    swipe(540, 1200, 540, 600); // scroll
  }, 'Historial ventas') ? 1 : 0;

  ok += await capture('compr/compr-06.png', async () => {
    back(); await wait(300);
    tap(540, 800); // segundo item
    await wait(800);
  }, 'Detalle Lácteos') ? 1 : 0;

  ok += await capture('compr/compr-07.png', async () => {
    swipe(540, 1200, 540, 400);
  }, 'Contratos') ? 1 : 0;

  ok += await capture('compr/compr-08.png', async () => {
    back(); await wait(300);
    swipe(540, 800, 540, 200); // scroll KPIs listado
  }, 'KPIs listado') ? 1 : 0;

  // ─── PROVEEDORES ─────────────────────────────────────────────
  console.log('\n📂 PROVEEDORES');
  total += 8;

  ok += await capture('prov/prov-01.png', async () => {
    NAV.proveedores();
  }, 'Listado proveedores') ? 1 : 0;

  ok += await capture('prov/prov-02.png', async () => {
    tap(972, 2100);
    await wait(500);
  }, 'Nuevo proveedor') ? 1 : 0;

  ok += await capture('prov/prov-03.png', async () => {
    swipe(540, 1200, 540, 600);
  }, 'Formulario categorías') ? 1 : 0;

  ok += await capture('prov/prov-04.png', async () => {
    back(); await wait(300);
    tap(540, 600);
    await wait(800);
  }, 'Piensos El Trébol') ? 1 : 0;

  ok += await capture('prov/prov-05.png', async () => {
    swipe(540, 1200, 540, 600);
  }, 'Historial gastos') ? 1 : 0;

  ok += await capture('prov/prov-06.png', async () => {
    back(); await wait(300);
    tap(540, 800);
    await wait(800);
  }, 'VetPlus detalle') ? 1 : 0;

  ok += await capture('prov/prov-07.png', async () => {
    back(); await wait(300);
    tap(540, 1000);
    await wait(800);
  }, 'Maquinaria detalle') ? 1 : 0;

  ok += await capture('prov/prov-08.png', async () => {
    back(); await wait(300);
    swipe(540, 800, 540, 200);
  }, 'KPIs proveedores') ? 1 : 0;

  // ─── TRANSPORTISTAS ──────────────────────────────────────────
  console.log('\n📂 TRANSPORTISTAS');
  total += 8;

  ok += await capture('trans/trans-01.png', async () => {
    NAV.transportistas();
  }, 'Listado transportistas') ? 1 : 0;

  ok += await capture('trans/trans-02.png', async () => {
    tap(972, 2100);
    await wait(500);
  }, 'Nuevo transportista') ? 1 : 0;

  ok += await capture('trans/trans-03.png', async () => {
    swipe(540, 1200, 540, 800);
  }, 'Tipo vehículo') ? 1 : 0;

  ok += await capture('trans/trans-04.png', async () => {
    swipe(540, 1200, 540, 400);
  }, 'Certificado bienestar') ? 1 : 0;

  ok += await capture('trans/trans-05.png', async () => {
    back(); await wait(300);
    tap(540, 600);
    await wait(800);
  }, 'Transporte Ganaderos') ? 1 : 0;

  ok += await capture('trans/trans-06.png', async () => {
    back(); await wait(300);
    tap(540, 800);
    await wait(800);
  }, 'Logística Láctea') ? 1 : 0;

  ok += await capture('trans/trans-07.png', async () => {
    swipe(540, 1200, 540, 600);
  }, 'KPIs detalle') ? 1 : 0;

  ok += await capture('trans/trans-08.png', async () => {
    back(); await wait(300);
  }, 'KPIs listado') ? 1 : 0;

  // ─── ANIMALES ────────────────────────────────────────────────
  console.log('\n📂 ANIMALES Y REBAÑOS');
  total += 11;

  ok += await capture('anim/anim-01.png', async () => {
    NAV.animales();
    await wait(500);
  }, 'Estructura finca') ? 1 : 0;

  ok += await capture('anim/anim-02.png', async () => {
    tap(540, 400); // pestaña zonas
    await wait(500);
  }, 'Zonas') ? 1 : 0;

  ok += await capture('anim/anim-03.png', async () => {
    tap(540, 500); // pestaña rebaños
    await wait(500);
  }, 'Rebaños listado') ? 1 : 0;

  ok += await capture('anim/anim-04.png', async () => {
    tap(972, 2100);
    await wait(500);
  }, 'Nuevo rebaño') ? 1 : 0;

  ok += await capture('anim/anim-05.png', async () => {
    back(); await wait(300);
    tap(540, 600); // entrar en rebaño → animales
    await wait(800);
  }, 'Animales en rebaño') ? 1 : 0;

  ok += await capture('anim/anim-06.png', async () => {
    tap(972, 2100);
    await wait(500);
  }, 'Nuevo animal paso 1') ? 1 : 0;

  ok += await capture('anim/anim-07.png', async () => {
    swipe(540, 1200, 540, 600);
  }, 'Nuevo animal paso 2') ? 1 : 0;

  ok += await capture('anim/anim-08.png', async () => {
    swipe(540, 1200, 540, 200);
  }, 'Escáner crotal') ? 1 : 0;

  ok += await capture('anim/anim-09.png', async () => {
    back(); await wait(300);
    tap(540, 600);
    await wait(800);
  }, 'Detalle animal') ? 1 : 0;

  ok += await capture('anim/anim-10.png', async () => {
    swipe(540, 1200, 540, 600);
  }, 'Madre-cría genealogía') ? 1 : 0;

  ok += await capture('anim/anim-11.png', async () => {
    back(); await wait(300);
    swipe(540, 800, 540, 200);
  }, 'KPIs animales') ? 1 : 0;

  // ─── CONTRATOS ───────────────────────────────────────────────
  console.log('\n📂 CONTRATOS');
  total += 3;

  ok += await capture('contr/contr-01.png', async () => {
    NAV.compradores();
    await wait(500);
    tap(540, 600);
    await wait(500);
    swipe(540, 1000, 540, 400);
  }, 'Panel contratos') ? 1 : 0;

  ok += await capture('contr/contr-02.png', async () => {
    tap(540, 1200); // btn nuevo contrato
    await wait(500);
  }, 'Nuevo contrato') ? 1 : 0;

  ok += await capture('contr/contr-03.png', async () => {
    swipe(540, 1200, 540, 400);
  }, 'Tabla precios') ? 1 : 0;

  // ─── SANITARIOS ──────────────────────────────────────────────
  console.log('\n📂 SANITARIOS');
  total += 5;

  ok += await capture('san/san-01.png', async () => {
    NAV.animales();
    await wait(500);
    tap(540, 600);
    await wait(500);
    tap(540, 400); // tab sanitarios
    await wait(500);
  }, 'Sanitarios listado') ? 1 : 0;

  ok += await capture('san/san-02.png', async () => {
    tap(972, 2100);
    await wait(500);
  }, 'Nuevo sanitario') ? 1 : 0;

  ok += await capture('san/san-03.png', async () => {
    swipe(540, 1200, 540, 700);
  }, 'Tipos tratamiento') ? 1 : 0;

  ok += await capture('san/san-04.png', async () => {
    swipe(540, 1200, 540, 400);
  }, 'Alerta sanitaria') ? 1 : 0;

  ok += await capture('san/san-05.png', async () => {
    back(); await wait(300);
    swipe(540, 800, 540, 200);
  }, 'Historial sanitario') ? 1 : 0;

  // ─── REPRODUCCIÓN ────────────────────────────────────────────
  console.log('\n📂 REPRODUCCIÓN');
  total += 5;

  ok += await capture('rep/rep-01.png', async () => {
    tap(540, 500); // tab reproducción
    await wait(500);
  }, 'Línea temporal') ? 1 : 0;

  ok += await capture('rep/rep-02.png', async () => {
    tap(972, 2100);
    await wait(500);
  }, 'Nuevo evento') ? 1 : 0;

  ok += await capture('rep/rep-03.png', async () => {
    swipe(540, 1200, 540, 700);
  }, 'Tipos de evento') ? 1 : 0;

  ok += await capture('rep/rep-04.png', async () => {
    back(); await wait(300);
    swipe(540, 1200, 540, 500);
  }, 'Ciclo completo') ? 1 : 0;

  ok += await capture('rep/rep-05.png', async () => {
    swipe(540, 1200, 540, 200);
  }, 'Árbol genealógico') ? 1 : 0;

  console.log(`\n✅ Completado: ${ok}/${total}`);
  console.log(`📁 Guardados en www/manual/img/\n`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
